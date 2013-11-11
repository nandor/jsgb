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
   * Converts a number to hex and pads with
   * leading zeros
   */
  function hex( x, n )
  {
    var s;

    s = x.toString( 16 );
    while ( s.length < n )
    {
      s = "0" + s;
    }

    return "0x" + s;
  }


  /**
   * Converts a number to binary and pads with
   * leading zeros
   */
  function bin( x, n )
  {
    var s;

    s = x.toString( 2 );
    while ( s.length < n )
    {
      s = "0" + s;
    }

    return "0b" + s;
  }


  /**
   * Handles messages from the worker thread
   */
  function message( msg )
  {
    switch ( msg.type )
    {
      case 'vsync':
      {
        for ( var i = 0; i < vram.data.length; ++i )
        {
          vram.data[ i ] = msg.data[ i ];
        }

        ctx.putImageData( vram, 0, 0 );
        return;
      }
      case 'halt':
      {
        running = false;
        return;
      }
      case 'debug':
      {
        $( "#dbg-reg-a"  ).text( hex( msg.data.a,  2 ) );
        $( "#dbg-reg-f"  ).text( bin( msg.data.f,  8 ) );
        $( "#dbg-reg-b"  ).text( hex( msg.data.b,  2 ) );
        $( "#dbg-reg-c"  ).text( hex( msg.data.c,  2 ) );
        $( "#dbg-reg-d"  ).text( hex( msg.data.b,  2 ) );
        $( "#dbg-reg-e"  ).text( hex( msg.data.c,  2 ) );
        $( "#dbg-reg-h"  ).text( hex( msg.data.h,  2 ) );
        $( "#dbg-reg-l"  ).text( hex( msg.data.l,  2 ) );
        $( "#dbg-reg-sp" ).text( hex( msg.data.sp, 4 ) );
        $( "#dbg-reg-pc" ).text( hex( msg.data.pc, 4 ) );
        return;
      }
      case 'log':
      {
        console.log( msg.data );
        return;
      }
    }
  }


  /**
   * Starts the emulator
   */
  $( document ).on( 'click',  "#btn-start", function( )
  {
    if ( running )
      return;

    // Start the emulator
    worker.postMessage( {
      'type': 'start',
      'data': '../10.gb'
    } );

    running = true;
  } );


  /**
   * Performs a single step
   */
  $( document ).on( 'click', "#btn-step", function( )
  {
    if ( running || !worker ) {
      return;
    }

    worker.postMessage( {
      'type': 'step',
      'data': null
    } );

    running = false;
  } );


  /**
   * Stops the emulator
   */
  $( document ).on( 'click', "#btn-stop", function( )
  {
    if ( !worker ) {
      return;
    }

    worker.postMessage( {
      'type': 'stop',
      'data': null
    } );

    running = false;
  } );


  /**
   * Initialises the ui
   */
  $( window ).on( 'ready', function( )
  {
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
    running = false;
    worker  = new Worker( 'script/emu.js' );
    worker.addEventListener( 'message', function( e )
    {
      message( e.data );
    } );
  } );
} );