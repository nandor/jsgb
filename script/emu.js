/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

importScripts( '../script/cpu.js'
             , '../script/ram.js'
             , '../script/rom.js'
             );


/**
 * Handles messages such as start, stop, vblank
 */
onmessage = function( e )
{
  var t0 = ( new Date( ) ).getTime( );
  while ( emu.cycles <= 4000000 ) {
    emu.tick( );
  }
  var t1 = ( new Date( ) ).getTime( );
  throw ( t1 - t0 );
}