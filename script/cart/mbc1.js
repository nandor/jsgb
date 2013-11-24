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
    this.rom_ram_mode = false;
    this.ram_bank = 0x00;
    this.rom_bank = 0x01;
    this.ram_key = this.title + "_ram_bank";

    this.load_banks( );
  }

  /**
   * Loads RAM banks from local storage
   */
  emu.MBC1.prototype.load_banks = function( )
  {
    var banks = JSON.parse( localStorage.getItem( this.ram_key ) );

    this.ram_banks = [
      new Uint8Array( 0x2000 ),
      new Uint8Array( 0x2000 ),
      new Uint8Array( 0x2000 ),
      new Uint8Array( 0x2000 )
    ];

    if ( !banks )
    {
      this.save_banks( );
    }
    else
    {
      for ( var i = 0; i < 4; ++i )
      {
        for ( var j = 0; j < 0x2000; ++j )
        {
          this.ram_banks[ i ][ j ] = banks[ i ][ j ];
        }
      }
    }
  }

  /**
   * Saves RAM banks to local storage
   */
  emu.MBC1.prototype.save_banks = function( )
  {
    localStorage.setItem( this.ram_key, JSON.stringify( this.ram_banks ) );
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
          this.save_banks( );
        }
        return;
      }
      case 0x2000: case 0x3000:
      {
        this.rom_bank = ( this.rom_bank & 0xE0 ) | ( val & 0x1F ? val & 0x1F : 0x01 );
        return;
      }
      case 0x4000: case 0x5000:
      {
        if ( this.rom_ram_mode )
        {
          this.ram_bank = val & 0x03;
        }
        else
        {
          this.rom_bank = ( this.rom_bank & 0x1F ) | ( ( val & 0x03 ) << 5);
        }
        return;
      }
      case 0x6000: case 0x7000:
      {
        this.rom_ram_mode = val != 0x00;
        return;
      }
      case 0xA000: case 0xB000:
      {
        this.ram_banks[ this.ram_bank ][ addr - 0xA000 ] = val & 0xFF;
        return;
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
      case 0xA000: case 0xB000:
      {
        return this.ram_banks[ this.ram_bank ][ addr - 0xA000 ];
      }
    }
  }
} ) ( this.emu = this.emu || { } );
