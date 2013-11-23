/**
 * This file is part of the JavaScript GameBoy emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( emu )
{
  /**
   * MBC1 cartridge
   */
  emu.MBC1 = function( rom )
  {
    this.rom = rom;
    this.title = rom.title;
    this.enable_ram = false;
    this.ram_bank   = 0x00;
    this.rom_bank   = 0x00;
  }

  /**
   * MBC1 control register write
   */
  emu.MBC1.prototype.set_byte = function( addr, val )
  {
    switch ( addr & 0xF000 )
    {
      case 0x0000: case 0x1000:
      {
        if ( val == 0x0A )
        {
          this.enable_ram = true;
        }
        else
        {
          this.enable_ram = false;
        }
        break;
      }
      case 0x2000: case 0x3000:
      {
        this.rom_bank = ( this.rom_bank & 0xE0 ) | ( val & 0x1F ? val & 0x1F : 0x01 );
      }
    }
  }

  /**
   * MBC1 control register read
   */
  emu.MBC1.prototype.get_byte = function( addr )
  {
    switch ( addr & 0xF000 )
    {
      case 0x4000: case 0x5000: case 0x6000: case 0x7000:
      {
        return this.rom.data[ ( this.rom_bank - 1 ) * 0x4000 + addr ];
      }
    }
  }
} ) ( this.emu = this.emu || { } );
