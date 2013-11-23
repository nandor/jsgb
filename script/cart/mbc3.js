/**
 * This file is part of the JavaScript GameBoy emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( emu )
{
  /**
   * MBC3 cartridge
   */
  emu.MBC3 = function( rom )
  {
    this.rom        = rom;
    this.title      = rom.title;
    this.enable_ram = false;
    this.ram_bank   = 0x00;
    this.rom_bank   = 0x00;

    this.ram_key = this.title + "_ram_bank";

    this.load_banks( );
  }

  /**
   * Loads RAM banks from local storage
   */
  emu.MBC3.prototype.load_banks = function( )
  {
    this.ram_banks = JSON.parse( localStorage.getItem( this.ram_key ) );

    if ( !this.ram_banks ) {
      this.ram_banks = [
        new Uint8Array( 0x2000 ),
        new Uint8Array( 0x2000 ),
        new Uint8Array( 0x2000 ),
        new Uint8Array( 0x2000 )
      ];
    }
  }

  /**
   * Saves RAM banks to local storage
   */
  emu.MBC3.prototype.save_banks = function( )
  {
    localStorage.setItem( this.ram_key, JSON.stringify( this.ram_banks ) );
  }

  /**
   * MBC3 control register write
   */
  emu.MBC3.prototype.set_byte = function( addr, val )
  {
    switch ( addr & 0xF000 )
    {
      case 0x0000: case 0x1000:
      {
        if ( val == 0x0A )
        {
          this.enable_ram = true;
          this.load_banks( );
        }
        else
        {
          this.enable_ram = false;
          this.save_banks( );
        }
        break;
      }
      case 0x2000: case 0x3000:
      {
        this.rom_bank = ( val & 0x7F ) ? ( val & 0x7F ) : 0x01;
        break;
      }
      case 0x4000: case 0x5000:
      {
        if ( val < 0x04 )
        {
          this.ram_bank = val;
          this.save_banks( );
        }
        else
        {
          console.log( "MBC3: unimplemented" );
        }
        break;
      }
      case 0xA000: case 0xB000:
      {
        this.ram_banks[ this.ram_bank ][ addr - 0xA000 ] = val & 0xFF;
        break;
      }
      default:
      {
        console.log( "MBC3: unimplemented" );
        break;
      }
    }
  }

  /**
   * MBC3 control register read
   */
  emu.MBC3.prototype.get_byte = function( addr )
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

