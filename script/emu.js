/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( emu )
{
  // Display
  emu.canvas   = null;
  emu.ctx      = null;
  emu.ctx_data = null;
  emu.vram     = null;

  // Keyboard
  emu.keys             = 0xFF;
  emu.key_start        = false;
  emu.key_select       = false;
  emu.key_a            = false;
  emu.key_b            = false;
  emu.key_left         = false;
  emu.key_right        = false;
  emu.key_up           = false;
  emu.key_down         = false;

  /**
   * Loads a rom file
   */
  emu.load_rom = function( file, callback )
  {
    var req;

    req = new XMLHttpRequest( );
    req.open( "GET", file, true );
    req.responseType = "arraybuffer";

    req.onload = function( evt )
    {
      emu.read_rom( new emu.ROM( req.response ) );
      if ( callback )
      {
        callback( );
      }
    }

    req.send( );
  }

  /**
   * Main loop
   */
  emu.loop = function( )
  {
    emu.wait = false;

    while ( !emu.wait && !emu.stopped )
    {
      emu.tick( );
    }

    emu.ctx.putImageData( emu.ctx_data, 0, 0 );

    if ( !emu.stopped )
    {
      requestAnimationFrame( emu.loop );
    }
  }

  /**
   * UI init
   */
  $( function( )
  {
    /**
     * Starts the emulator
     */
    $( "#btn-start" ).on( 'click', function( )
    {
      if ( emu.stopped )
      {
        emu.stopped = false;
        emu.loop( );
      }
    } );

    /**
     * Stops the emulator
     */
    $( "#btn-stop" ).on( 'click', function( )
    {
      emu.stopped = true;
    } );

    /**
     * Handles keyboard input ( key press )
     */
    $( document ).on( 'keydown', function( evt )
    {
      switch ( evt.keyCode )
      {
        case 38: emu.key_up     = true; emu.ifPins = true; break;
        case 40: emu.key_down   = true; emu.ifPins = true; break;
        case 37: emu.key_left   = true; emu.ifPins = true; break;
        case 39: emu.key_right  = true; emu.ifPins = true; break;
        case 81: emu.key_start  = true; emu.ifPins = true; break;
        case 87: emu.key_select = true; emu.ifPins = true; break;
        case 65: emu.key_a      = true; emu.ifPins = true; break;
        case 66: emu.key_b      = true; emu.ifPins = true; break;
      }

      if ( emu.stopped && emu.ifPins )
      {
        emu.stopped = false;
        emu.loop( );
      }
    } );

    /**
     * Handles keyboard input ( key release )
     */
    $( document ).on( 'keyup', function( evt )
    {
      switch ( evt.keyCode )
      {
        case 38: emu.key_up     = false; break;
        case 40: emu.key_down   = false; break;
        case 37: emu.key_left   = false; break;
        case 39: emu.key_right  = false; break;
        case 81: emu.key_start  = false; break;
        case 87: emu.key_select = false; break;
        case 65: emu.key_a      = false; break;
        case 66: emu.key_b      = false; break;
      }
    } );

    // Get the emu.canvas
    emu.canvas = $("#lcd").get( 0 );
    if ( !emu.canvas )
    {
      throw "emu.canvas not found"
    }

    emu.ctx = emu.canvas.getContext( '2d' )
    if ( !emu.ctx )
    {
      throw "Cannot create context";
    }

    emu.ctx_data = emu.ctx.getImageData( 0, 0, 160, 144 );
    emu.vram = emu.ctx_data.data;

    // Load the rom
    emu.load_rom( 'pb.gb' , emu.loop );
  } );
} ) ( this.emu = this.emu || { } );
