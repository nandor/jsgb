/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( emu )
{
  // Clock cycle counters
  emu.cpu_cycles     = 0;
  emu.lcd_cycles     = 0;
  emu.counter_cycles = 0;
  emu.divider_cycles = 0;

  // Timer status
  emu.timer_divider = 0x00;
  emu.timer_counter = 0x00;
  emu.timer_modulo  = 0x00;
  emu.timer_enable  = false;
  emu.timer_clock   = 0x00;

  /**
   * Increment the number of clock cycles
   */
  emu.inc_cycles = function( n )
  {
    if ( n <= 0 ) {
      return;
    }

    emu.cpu_cycles     += n;
    emu.lcd_cycles     += n;
    emu.divider_cycles += n;
    emu.counter_cycles += n;

    emu.update_counter( );
    emu.update_divider( );
  }

  /**
   * Returns the timer counter
   */
  emu.update_counter = function( )
  {
    var cycles = 0;

    if ( !emu.timer_enable )
    {
      return;
    }

    // Select the timer frequency
    switch ( emu.timer_clock )
    {
     case 0x00: cycles = 1024; break; // 4.096 KHz
     case 0x01: cycles = 16;   break; // 262.144 KHz
     case 0x02: cycles = 64;   break; // 65.535 KHz
     case 0x03: cycles = 256;  break; // 16.384 KHz
    }

    // Increment the timer counter
    while ( emu.counter_cycles >= cycles )
    {
      emu.counter_cycles -= cycles;
      emu.timer_counter++;

      if ( emu.timer_counter > 0xFF ) {
        emu.ifTimer = true;
        emu.timer_counter = emu.timer_modulo;
      }
    }
  }

  /**
   * Updates the divider register
   */
  emu.update_divider = function( )
  {
    while ( emu.divider_cycles >= 256 ) {
      emu.divider_cycles -= 256;
      emu.timer_divider = ( emu.timer_divider + 1 ) & 0xFF;
    }
  }
} ) ( this.emu = this.emu || { } );
