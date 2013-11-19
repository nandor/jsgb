/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( )
{
  // Clock cycle counters
  emu.cpu_cycles     = 0;
  emu.gpu_cycles     = 0;
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
    emu.cpu_cycles     += n;
    emu.gpu_cycles     += n;
    emu.divider_cycles += n;

    if ( emu.timer_enable )
    {
      emu.counter_cycles += n;
    }
  }

  /**
   * Updates timer registers & fires interrupts
   */
  emu.timer_step = function( )
  {
    var cycles = 0;

    if ( emu.timer_enable )
    {
      switch ( emu.timer_clock )
      {
        // 4.096 KHz
        case 0x00: cycles = 976; break

        // 262.144 KHz
        case 0x01: cycles = 15;  break;

        // 65.535 KHz
        case 0x02: cycles = 61;  break;

        // 16.384 KHz
        case 0x03: cycles = 244; break;
      }

      // Increment the timer counter
      if ( emu.counter_cycles > cycles )
      {
        var inc;

        inc = Math.floor( emu.counter_cycles / cycles );
        emu.counter_cycles %= cycles;

        emu.timer_counter += inc;
        while ( emu.timer_counter > 0xFF ) {
          emu.ifTimer = true;
          emu.timer_counter = emu.timer_modulo + ( emu.timer_counter - 0xFF );
        }
      }
    }

    // Increment the divider
    if ( emu.divider_cycles > 244 ) {
      emu.divider_cycles -= 244;
      emu.timer_divider = ( emu.timer_divider + 1 ) & 0xFF;
    }
  }

} ) ( this.emu = this.emu || { } );