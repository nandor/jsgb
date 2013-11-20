/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function ( emu ) {
  emu.canvas   = null;
  emu.ctx      = null;
  emu.ctx_data = null;
  emu.vram     = null;

  /**
   * Converts a number to hex and pads it with leading zeros
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
   * Converts a number to binary and pads it with leading zeros
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
      emu.read_rom( new ROM( req.response ) );
      if ( callback )
      {
        callback( );
      }
    }

    req.send( );
  }

  /**
   * Displays debug info
   */
  emu.show_debug_info = function( )
  {
    $( "#dbg-reg-a"  ).text( hex( emu.a,      2 ) );
    $( "#dbg-reg-f"  ).text( bin( emu.f,      8 ) );
    $( "#dbg-reg-b"  ).text( hex( emu.b,      2 ) );
    $( "#dbg-reg-c"  ).text( hex( emu.c,      2 ) );
    $( "#dbg-reg-d"  ).text( hex( emu.d,      2 ) );
    $( "#dbg-reg-e"  ).text( hex( emu.e,      2 ) );
    $( "#dbg-reg-h"  ).text( hex( emu.h,      2 ) );
    $( "#dbg-reg-l"  ).text( hex( emu.l,      2 ) );
    $( "#dbg-reg-sp" ).text( hex( emu.sp,     4 ) );
    $( "#dbg-reg-pc" ).text( hex( emu.pc,     4 ) );
    $( "#dbg-reg-ly" ).text( hex( emu.lcd_ly, 2 ) );
  }

  $( window ).on( 'ready', function( )
  {
    /**
     * Starts the emulator
     */
    $( "#btn-start" ).on( 'click', function( )
    {
      emu.stopped = false;
    } );


    /**
     * Performs a single step
     */
    $( "#btn-step" ).on( 'click', function( )
    {
      emu.stopped = false;
      emu.cpu_tick( );
      emu.stopped = true;
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
    emu.load_rom( 'opus5.gb' , function loop( )
    {
      emu.wait = false;

      while ( !emu.wait && !emu.stopped )
      {
        emu.tick( );
      }

      emu.ctx.putImageData( emu.ctx_data, 0, 0 );

      if ( !emu.stopped )
      {
        requestAnimationFrame( loop );
      }
    } );
  } );
} ) ( this.emu = this.emu || { } );
