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
      'd': emu.d,
      'e': emu.e,
      'h': emu.h,
      'l': emu.l,
      'sp': emu.sp,
      'pc': emu.pc,
      'ly': emu.lcd_ly
    }
  } );
}


/**
 * Runs until stopped
 */
function run( )
{
  var t0, t1, c0;

  t0 = ( new Date( ) ).getTime( );

  // Do stuff
  c0 = emu.cycles;
  emu.wait = false;

  do
  {
    emu.tick( );
  } while ( !emu.wait && !emu.stopped );

  // Only run a new frame if we did not stop
  if ( !emu.stopped )
  {
    // Wait to keep a steady framerate
    //do
    //{
    //  t1 = ( new Date( ) ).getTime( );
    //} while ( t1 - t0 < 16 );

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
    case 'key':
    {
      switch ( e.data.data.key )
      {
        case 'up':     emu.key_up     = e.data.data.state; break;
        case 'down':   emu.key_down   = e.data.data.state; break;
        case 'left':   emu.key_left   = e.data.data.state; break;
        case 'right':  emu.key_right  = e.data.data.state; break;
        case 'a':      emu.key_a      = e.data.data.state; break;
        case 'b':      emu.key_b      = e.data.data.state; break;
        case 'start':  emu.key_start  = e.data.data.state; break;
        case 'select': emu.key_select = e.data.data.state; break;
      }
      return;
    }
    case 'break':
    {
      emu.debug_break = e.data.data;
      return;
    }
    case 'stop':
    {
      emu.halted = true;
      return;
    }
  }
}
