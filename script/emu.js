/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

importScripts( '../script/cpu.js'
             , '../script/ram.js'
             , '../script/rom.js'
             , '../script/lcd.js'
             );


/**
 * Handles messages such as start, stop, vblank
 */
onmessage = function( e )
{
  var req;

  req = new XMLHttpRequest( );
  req.open( "GET", e.data, true );
  req.responseType = "arraybuffer";

  req.onload = function( evt )
  {
    postMessage( { 'type': 'log', 'data': 'Loaded ROM: ' + e.data } );

    rom = new ROM( req.response );
    emu.load_rom( rom );
    run( );
  }

  req.send( );
}


function run( )
{
  while ( true )
  {
    t0 = ( new Date( ) ).getTime( );

    for ( var i = 0; i <= 153; ++i )
    {
      emu.lcd_ly = i;
      emu.cycles = 0;

      while ( emu.cycles <= 437 )
      {
        emu.tick( );
      }
    }

    // 'vsync'
    emu.build_vram( );
    postMessage( {
      'type': 'vsync',
      'data': emu.vram
    } );

    // Wait a bit to keep a steady framerate
    do {
      t1 = ( new Date( ) ).getTime( );
    } while ( t1 - t0 < 16 );
  }
}