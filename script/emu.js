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
 * Prevents the ROM from being reloaded
 * when we resume the emulator
 */
var rom_loaded = false;


/**
 * True if we want to send back debug info
 */
var debug = false;


/**
 * Loads a rom file
 */
function load_rom( file, callback )
{
  var req;

  req = new XMLHttpRequest( );
  req.open( "GET", file, true );
  req.responseType = "arraybuffer";

  req.onload = function( evt )
  {
    callback( new ROM( req.response ) );
  }

  req.send( );
}


/**
 * Sends a log message to the client
 */
function log( msg )
{
  postMessage( {
    'type': 'log',
    'data': msg
  } );
}


/**
 * Sends debug info
 */
function send_debug_info( )
{
  postMessage( {
    'type': 'debug',
    'data': {
      'a': emu.a,
      'f': emu.f,
      'b': emu.b,
      'c': emu.c,
      'b': emu.d,
      'c': emu.e,
      'h': emu.h,
      'l': emu.l,
      'sp': emu.sp,
      'pc': emu.pc
    }
  } );
}


/**
 * Runs until halted
 */
function run( )
{
  var t0, t1;

  t0 = ( new Date( ) ).getTime( );

  // Do stuff
  do
  {
    emu.tick( );
  } while ( emu.cycles < 67298 && !emu.halted );
  emu.cycles = 0;

  // 'vsync'
  send_debug_info( );
  emu.build_vram( );
  postMessage( {
    'type': 'vsync',
    'data': emu.vram
  } );


  // Only run a new frame if we did not halt
  if ( !emu.halted )
  {
    // Wait to keep a steady framerate
    do
    {
      t1 = ( new Date( ) ).getTime( );
    } while ( t1 - t0 < 16 );

    setTimeout( run, 0 );
  }

  postMessage( {
    'type': 'halt',
    'data': null
  } );
}


/**
 * Handles messages such as start, stop, vblank
 */
onmessage = function( e )
{
  switch ( e.data.type )
  {
    case 'start':
    {
      if ( !rom_loaded )
      {
        rom_loaded = true;
        load_rom( e.data.data, function( rom )
        {
          emu.load_rom( rom );
          run( );
        } );
      }
      else
      {
        emu.halted = false;
        run( );
      }

      return;
    }
    case 'step':
    {
      emu.halted = false;
      emu.tick( );
      send_debug_info( );
      return;
    }
    case 'stop':
    {
      emu.halted = true;
      return;
    }
  }
}
