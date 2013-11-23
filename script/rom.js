/*
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( emu )
{
  /**
   * Extracts information from a cartridge
   */
  emu.ROM = function( data )
  {
    if ( !data ) {
      throw "Cannot read ROM";
    }

    this.data = new Uint8Array( data );

    if ( this.data.length < 0x014F ) {
      throw "Incomplete ROM";
    }

    this.title             = "";
    this.manuf_code        = "XXXX";
    this.cgb               = this.data[ 0x0143 ];
    this.new_licensee_code = "XX";
    this.sgb               = this.data[ 0x0146 ];
    this.rom_size          = 0;
    this.ram_size          = 0;
    this.dest_code         = this.data[ 0x014A ];
    this.old_licensee_code = this.data[ 0x014B ];
    this.version_number    = this.data[ 0x014C ];
    this.header_sum        = this.data[ 0x014D ];
    this.data_sum          = this.data[ 0x014F ] | (this.data[ 0x014E ] << 8);

    this.read_title( );
    this.read_manuf_code( );
    this.read_new_licensee_code( );
    this.read_rom_size( );
    this.read_ram_size( );
    this.read_cartridge_type( );

    this.check_header( );
    this.check_data( );
  }

  /**
   * Compares the checksum of the header
   */
  emu.ROM.prototype.check_header = function( )
  {
    var sum = 0;
    for ( var i = 0x0134; i <= 0x014C; ++i )
    {
      sum = sum - this.data[ i ] - 1;
    }

    if ( ( sum & 0xFF ) != this.header_sum )
    {
      throw "Header checksum mismatch 0x" + ( sum & 0xFF ).toString( 16 );
    }
  }

  /**
   * Compares the checksum of the whole ROM
   */
  emu.ROM.prototype.check_data = function( )
  {
    var sum = 0;
    for ( var i = 0x0000; i < this.data.length; ++i )
    {
      if ( i != 0x014E && i != 0x014F )
      {
        sum += this.data[ i ];
      }
    }

    if ( (sum & 0xFFFF) != this.data_sum ) {
      console.log( "ROM checksum mismatch 0x" + ( sum & 0xFFFF).toString( 16 ) );
    }
  }

  /**
   * Reads the cartridge title
   */
  emu.ROM.prototype.read_title = function( )
  {
    this.title = "";
    for ( var i = 0x0134; i < 0x013F && this.data[ i ]; ++i )
    {
      this.title += String.fromCharCode( this.data[ i ] );
    }
  }

  /**
   * Reads the manufacturer code
   */
  emu.ROM.prototype.read_manuf_code = function( )
  {
    this.manuf_code = String.fromCharCode(
      this.data[ 0x013F ], this.data[ 0x0140 ],
      this.data[ 0x0141 ], this.data[ 0x0142 ]
    );
  }

  /**
   * Reads the licensee code
   */
  emu.ROM.prototype.read_new_licensee_code = function( )
  {
    this.new_licensee_code = String.fromCharCode(
      this.data[ 0x0144 ], this.data[ 0x0145 ]
    );
  }

  /**
   * Reads the size of the cartridge ROM
   */
  emu.ROM.prototype.read_rom_size = function( )
  {
    switch ( this.data[ 0x0148 ] ) {
      case 0x00: this.rom_size =  32 << 10; break;
      case 0x01: this.rom_size =  64 << 10; break;
      case 0x02: this.rom_size = 128 << 10; break;
      case 0x03: this.rom_size = 256 << 10; break;
      case 0x04: this.rom_size = 512 << 10; break;
      case 0x05: this.rom_size =   1 << 20; break;
      case 0x06: this.rom_size =   2 << 20; break;
      case 0x07: this.rom_size =   4 << 20; break;
      case 0x52: this.rom_size =  72 << 15; break;
      case 0x53: this.rom_size =  80 << 15; break;
      case 0x54: this.rom_size =  96 << 15; break;
      default:
        throw "Invalid ROM size: 0x" + this.data[ 0x0148 ].toString( 16 );
    }
  }

  /**
   * Reads the size of the cartridge ram
   */
  emu.ROM.prototype.read_ram_size = function( )
  {
    switch ( this.data[ 0x149 ] )
    {
      case 0x00: this.ram_size =  0 << 10; break;
      case 0x01: this.ram_size =  2 << 10; break;
      case 0x02: this.ram_size =  8 << 10; break;
      case 0x03: this.ram_size = 32 << 10; break;
      default:
        throw "Invalid ram size: 0x" + this.data[ 0x0149 ].toString( 16 );
    }
  }

  /**
   * Extracts the features of a cartridge
   */
  emu.ROM.prototype.read_cartridge_type = function( )
  {
    this.cartridge_type = this.data[ 0x0147 ];

    this.has_rom     = false;
    this.has_mbc1    = false;
    this.has_mbc2    = false;
    this.has_mbc3    = false;
    this.has_ram     = false;
    this.has_sram    = false;
    this.has_battery = false;
    this.has_rumble  = false;
    this.has_mmm01   = false;
    this.has_camera  = false;
    this.has_bandai  = false;
    this.has_hudson  = false;

    switch ( this.cartridge_type )
    {
      // ROM only
      case 0x00:
        this.has_rom = true;
        break;

      // ROM + MBC1
      case 0x01:
        this.has_rom  = true;
        this.has_mbc1 = true;
        break;

      // ROM + MBC1 + RAM
      case 0x02:
        this.has_rom  = true;
        this.has_mbc1 = true;
        this.has_ram  = true;
        break;

      // ROM + MBC1 + RAM + BATT
      case 0x03:
        this.has_rom     = true;
        this.has_mbc1    = true;
        this.has_ram     = true;
        this.has_battery = true;
        break;

      // ROM + MBC2
      case 0x05:
        this.has_rom  = true;
        this.has_mbc2 = true;
        break;

      // ROM + MBC2 + BATT
      case 0x06:
        this.has_rom     = true;
        this.has_mbc2    = true;
        this.has_battery = true;
        break;

      // ROM + RAM
      case 0x08:
        this.has_rom = true;
        this.has_ram = true;
        break;

      // ROM + RAM + BATT
      case 0x09:
        this.has_rom     = true;
        this.has_ram     = true;
        this.has_battery = true;
        break;

      // ROM + MMM01
      case 0x0B:
        this.has_rom   = true;
        this.has_mmm01 = true;
        break;

      // ROM + MMM01 + SRAM
      case 0x0C:
        this.has_rom   = true;
        this.has_mmm01 = true;
        this.has_sram  = true;
        break;

      // ROM + MMM01 + SRAM + BATT
      case 0x0D:
        this.has_rom     = true;
        this.has_mmm01   = true;
        this.has_sram    = true;
        this.has_battery = true;
        break;

      // ROM + MBC3 + RAM
      case 0x12:
        this.has_rom  = true;
        this.has_mbc3 = true;
        this.has_ram  = true;
        break;

      // ROM + MBC3 + RAM + BATT
      case 0x13:
        this.has_rom     = true;
        this.has_mbc3    = true;
        this.has_ram     = true;
        this.has_battery = true;
        break;

      // ROM + MBC5
      case 0x19:
        this.has_rom  = true;
        this.has_mbc5 = true;
        break;

      // ROM + MBC5 + RAM
      case 0x1A:
        this.has_rom  = true;
        this.has_mbc5 = true;
        this.has_ram  = true;
        break;

      // ROM + MBC5 + RAM + BATT
      case 0x1B:
        this.has_rom     = true;
        this.has_mbc5    = true;
        this.has_ram     = true;
        this.has_battery = true;
        break;

      // ROM + MBC5 + RUMBLE
      case 0x1C:
        this.has_rom    = true;
        this.has_mbc5   = true;
        this.has_rumble = true;
        break;

      // ROM + MBC5 + RUMBLE + SRAM
      case 0x1D:
        this.has_rom    = true;
        this.has_mbc5   = true;
        this.has_rumble = true;
        this.has_sram   = true;
        break;

      // ROM + MBC5 + RUMBLE + SRAM + BATT
      case 0x1E:
        this.has_rom     = true;
        this.has_mbc5    = true;
        this.has_rumble  = true;
        this.has_sram    = true;
        this.has_battery = true;
        break;

      // Pocket camera
      case 0x1F:
        this.has_camera = true;
        break;

      // Bandai TAMA5
      case 0xFD:
        this.has_bandai = true;
        break;

      // Hudson HUC-3
      case 0xFE:
        this.has_hudson = true;
        break;

      default:
        throw "Invalid cartridge_type: " + this.cartridge_type.toString( 16 );
    }
  }
} ) ( this.emu = this.emu || { } );