/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

$( function () {
  var canvas  = null;
  var ctx     = null;
  var vram    = null;
  var worker  = null;
  var running = false;
  var frame   = null;


  /**
   * Requests a ROM image from the server
   */
  function load_rom( rom_name )
  {
    var req;

    req = new XMLHttpRequest( );
    req.open( "GET", rom_name, true );
    req.responseType = "arraybuffer";

    req.onload = function( evt )
    {
      rom = new ROM( req.response );
      emu.load_rom( rom );
    }

    req.send( );
  }

  /**
   * Handles messages from the worker thread
   */
  function message( msg )
  {
    switch ( msg.type )
    {
      case 'vsync':
        for ( var i = 0; i < vram.data.length; ++i )
        {
          vram.data[ i ] = msg.data[ i ];
        }

        ctx.putImageData( vram, 0, 0 );
        return;
      case 'log':
        console.log( msg.data );
        return;
    }
  }


  /**
   * Starts the emulator
   */
  $( document ).on( 'click',  "#btn-start", function( )
  {
    if ( running ) {
      return;
    }

    // Get the canvas
    canvas = $("#lcd").get( 0 );
    if ( !canvas )
    {
      throw "Canvas not found"
    }

    ctx = canvas.getContext( '2d' )
    if ( !ctx )
    {
      throw "Cannot create context";
    }

    vram = ctx.getImageData( 0, 0, 160, 144 );

    // Spawn the worker
    worker = new Worker( 'script/emu.js' );
    worker.addEventListener( 'message', function( e )
    {
      message( e.data );
      running = false;
    } );

    // Start the emulator
    worker.postMessage( "../test.gb" );
    running = true;
  } );


  /**
   * Stops the emulator
   */
  $( document ).on( 'click', "#btn-stop", function( )
  {
    if ( worker )
    {
      worker.terminate( );
    }

    if ( frame )
    {
      clearInterval( frame );
    }

    frame   = null;
    worker  = null;
    running = false;
  } );
} );