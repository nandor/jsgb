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
    this.rom = rom;
    this.title = rom.title;
    this.enable_ram = false;
    this.use_ram = true;
    this.ram_bank = 0x00;
    this.rom_bank = 0x00;
    this.rtc_reg = 0x00;
    this.rtc_regs = [ 0x00, 0x00, 0x00, 0x00, 0x00 ];
    this.last_latch = 0xFF;
    this.ram_key = this.title + "_ram_bank";

    this.load_banks( );
  }

  /**
   * Loads RAM banks from local storage
   */
  emu.MBC3.prototype.load_banks = function( )
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
        this.rom_bank = ( val & 0x7F ) ? ( val & 0x7F ) : 0x01;
        return;
      }
      case 0x4000: case 0x5000:
      {
        if ( val < 0x04 )
        {
          this.ram_bank = val;
          this.use_ram = true;
          this.save_banks( );
        }
        else if ( 0x08 <= val && val <= 0x0C )
        {
          this.rtc_reg = val - 0x08;
          this.use_ram = false;
        }
        return;
      }
      case 0x6000: case 0x7000:
      {
        if ( this.last_latch == 0x00 && val == 0x01 )
        {
          var now = new Date( ), then;
          // TODO: day counter
          this.rtc_regs[ 0x00 ] = now.getSeconds( );
          this.rtc_regs[ 0x01 ] = now.getMinutes( );
          this.rtc_regs[ 0x02 ] = now.getHours( );
          this.rtc_regs[ 0x03 ] = 0x00;
          this.rtc_regs[ 0x04 ] = 0x00;
        }

        this.last_latch = val;
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
        if ( this.use_ram )
        {
          return this.ram_banks[ this.ram_bank ][ addr - 0xA000 ];
        }
        else
        {
          return this.rtc_regs[ this.rtc_reg ];
        }
      }
    }
  }
} ) ( this.emu = this.emu || { } );

