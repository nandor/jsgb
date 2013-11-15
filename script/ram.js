/**
 * This file is part of the JavaScript GameBoy emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function ( emu )
{
  // Internal memory
  emu.cartridge_type   = 0x01;
  emu.ram              = new Uint8Array( 0x10000 );
  emu.nr               = new Uint8Array( 52 );
  emu.rom_bank         = 0x01;
  emu.rom_ram          = false;
  emu.rom_banking      = true;

  // Keyboard
  emu.keys             = 0xFF;
  emu.key_start        = false;
  emu.key_select       = false;
  emu.key_a            = false;
  emu.key_b            = false;
  emu.key_left         = false;
  emu.key_right        = false;
  emu.key_up           = false;
  emu.key_down         = false;

  // DMA
  emu.boot_rom_enabled = true;

  // Bootstrap rom, source:
  // http://gbdev.gg8.se/wiki/articles/Gameboy_Bootstrap_ROM
  emu.boot_rom = new Uint8Array( [
    0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32,
    0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0x0e,
    0x11, 0x3e, 0x80, 0x32, 0xe2, 0x0c, 0x3e, 0xf3,
    0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0,
    0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1a,
    0xcd, 0x95, 0x00, 0xcd, 0x96, 0x00, 0x13, 0x7b,
    0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x00, 0x06,
    0x08, 0x1a, 0x13, 0x22, 0x23, 0x05, 0x20, 0xf9,
    0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99,
    0x0e, 0x0c, 0x3d, 0x28, 0x08, 0x32, 0x0d, 0x20,
    0xf9, 0x2e, 0x0f, 0x18, 0xf3, 0x67, 0x3e, 0x64,
    0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x04,
    0x1e, 0x02, 0x0e, 0x0c, 0xf0, 0x44, 0xfe, 0x90,
    0x20, 0xfa, 0x0d, 0x20, 0xf7, 0x1d, 0x20, 0xf2,
    0x0e, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62,
    0x28, 0x06, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x06,
    0x7b, 0xe2, 0x0c, 0x3e, 0x87, 0xe2, 0xf0, 0x42,
    0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x05, 0x20,
    0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x06, 0x04,
    0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17,
    0x05, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9,
    0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
    0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
    0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
    0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
    0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
    0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
    0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c,
    0x21, 0x04, 0x01, 0x11, 0xa8, 0x00, 0x1a, 0x13,
    0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20,
    0xf5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20,
    0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x01, 0xe0, 0x50
  ] );


  /**
    Load data from a rom cartridge
  */
  emu.load_rom = function( rom )
  {
    // Choose an appropiate cartridge controller
    emu.cartridge_type = rom.cartridge_type;
    if ( emu.cartridge_type == 0x00 ) {
      emu.cartridge_type = 0x01;
    }

    // Load the first two banks
    for ( var i = 0; i < 0x8000; ++i )
    {
      emu.ram[ i ] = rom.data[ i ];
    }
  }


  /**
   * Retrieves a word from memory
   */
  emu.get_word = function( addr )
  {
    var b0, b1;

    b0 = emu.get_byte( addr );
    b1 = emu.get_byte( addr + 1 );

    return b0 | ( b1 << 8 );
  }

  /**
   * Sets the value of word in memory
   */
  emu.set_word = function( addr, v )
  {
    emu.set_byte( addr, v & 0xFF );
    emu.set_byte( addr + 1, ( v >> 8 ) & 0xFF );
  }


  /**
   * Returns the value of a single byte of memory
   */
  emu.get_byte = function( addr )
  {
    switch ( true )
    {
      case ( 0x0000 <= addr && addr < 0x0100 ):
      {
        if ( emu.boot_rom_enabled )
        {
          return emu.boot_rom[ addr ];
        }

        return emu.ram[ addr ];
      }

      // ROM
      case ( 0x0000 <= addr && addr < 0x8000 ):
      {
        return emu.ram[ addr ];
      }

      // Video RAM
      case ( 0x8000 <= addr && addr < 0xA000 ):
      {
        return emu.ram[ addr ];
      }

      // Switchable RAM bank
      case ( 0xA000 <= addr && addr < 0xC000 ):
      {
        return emu.ram[ addr ];
      }

      // Internal RAM & echo
      case ( 0xC000 <= addr && addr < 0xFE00 ):
      {
        return emu.ram[ addr ];
      }

      // Sprite attrib memory
      case ( 0xFE00 <= addr && addr < 0xFEA0 ):
      {
        return emu.ram[ addr ];
      }

      // Possibly invalid addresses
      case ( 0xFEA0 <= addr && addr < 0xFF00 ):
      {
        return emu.ram[ addr ];
      }

      // IO ports
      case ( 0xFF00 <= addr && addr < 0xFF80 ):
      {
        return emu.io_read( addr );
      }

      // High RAM area
      case ( 0xFF80 <= addr && addr < 0xFFFF ):
      {
        return emu.ram[ addr ];
      }

      // Enable interrupts register
      case ( addr == 0xFFFF ):
      {
        return emu.io_read( addr );
      }
    }

    throw new Error( "Reserved memory at 0x" + addr.toString( 16 ) );
  }

  /**
   * Sets the value of a single byte in memory
   */
  emu.set_byte = function( addr, val )
  {
    switch ( true ) {

      // Restart and interrupt vectors
      case ( 0x0000 <= addr && addr < 0x0100 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // MBC control
      case ( 0x0100 <= addr && addr < 0x8000 ):
      {
        switch ( emu.cartridge_type )
        {
          case 0x01: emu.mbc1_reg( addr, val ); break;
        }
        return;
      }

      // Video RAM
      case ( 0x8000 <= addr && addr < 0xA000 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // Switchable RAM bank
      case ( 0xA000 <= addr && addr < 0xC000 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // Internal RAM
      case ( 0xC000 <= addr && addr < 0xE000 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        if ( addr < 0xDE00 ) {
          emu.ram[ addr + 0x2000 ] = val & 0xFF;
        }
        return;
      }

      // Echo of internal RAM
      case ( 0xE000 <= addr && addr < 0xFE00 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        emu.ram[ addr - 0x2000 ] = val & 0xFF;
        return;
      }

      // Sprite attrib memory
      case ( 0xFE00 <= addr && addr < 0xFEA0 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // Possibly invalid addresses
      case ( 0xFEA0 <= addr && addr < 0xFF00 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // IO ports
      case ( 0xFF00 <= addr && addr < 0xFF80 ):
      {
        emu.io_write( addr, val );
        return;
      }

      // High RAM area
      case ( 0xFF80 <= addr && addr < 0xFFFF ):
      {
        emu.ram[ addr ] = val & 0xFF;
        return;
      }

      // Enable interrupts register
      case ( addr == 0xFFFF ):
      {
        emu.io_write( addr, val );
        return;
      }
    }

    throw new Error( "Reserved memory at 0x" + addr.toString( 16 ) );
  }


  /**
   * Write a value to an IO register
   */
  emu.io_write = function( addr, val )
  {
    switch ( true )
    {
      // P1
      case ( 0xFF00 == addr ):
        if ( !( val & 0x20 ) ) {
          emu.keys = 0x2F;
          emu.keys &= emu.key_start  ? 0x07 : 0xFF;
          emu.keys &= emu.key_select ? 0x0B : 0xFF;
          emu.keys &= emu.key_b      ? 0x0D : 0xFF;
          emu.keys &= emu.key_a      ? 0x0E : 0xFF;
          return;
        }

        if ( !( val & 0x10 ) ) {
          emu.keys = 0x1F;

          emu.keys &= emu.key_down  ? 0x07 : 0xFF;
          emu.keys &= emu.key_up    ? 0x0B : 0xFF;
          emu.keys &= emu.key_left  ? 0x0D : 0xFF;
          emu.keys &= emu.key_right ? 0x0E : 0xFF;
          return;
        }

        return;

      // NR x
      case ( 0xFF10 <= addr && addr <= 0xFF26 ):
        emu.nr[ addr - 0xFF00 ] = val & 0xFF;
        return;

      // IF
      case ( addr == 0xFF0F ):
        emu.ifPins   = ( val & 0x10 ) != 0x00;
        emu.ifSerial = ( val & 0x08 ) != 0x00;
        emu.ifTimer  = ( val & 0x04 ) != 0x00;
        emu.ifLCDC   = ( val & 0x02 ) != 0x00;
        emu.ifVBlank = ( val & 0x01 ) != 0x00;
        return;

      // LCDC
      case ( addr == 0xFF40 ):
        emu.lcd_enable      = val & 0x80 ? true : false;
        emu.lcd_wnd_tilemap = val & 0x40 ? 0x9C00 : 0x9800;
        emu.lcd_wnd_display = val & 0x20 ? true : false;
        emu.lcd_tile_data   = val & 0x10 ? 0x8000 : 0x8800;
        emu.lcd_bg_tilemap  = val & 0x08 ? 0x9C00 : 0x9800;
        emu.lcd_obj_size    = val & 0x04 ? 16 : 8;
        emu.lcd_obj_display = val & 0x02 ? true : false;
        emu.lcd_bg_display  = val & 0x01 ? true : false;
        return;

      // STAT
      case ( addr == 0xFF41 ):
        return;

      // SCY
      case ( addr == 0xFF42 ):
        emu.lcd_scy = val & 0xFF;
        return;

      // SCX
      case ( addr == 0xFF43 ):
        emu.lcd_scx = val & 0xFF;
        return;

      // LY
      case ( addr == 0xFF44 ):
        throw "IO register LY is read only";

      // LYC
      case ( addr == 0xFF45 ):
        return;

      // DMA
      case ( addr == 0xFF46 ):
        return;

      // BGP
      case ( addr == 0xFF47 ):
        emu.lcd_bg[ 0 ] = ( val & 0x03 ) >> 0;
        emu.lcd_bg[ 1 ] = ( val & 0x0C ) >> 2;
        emu.lcd_bg[ 2 ] = ( val & 0x30 ) >> 4;
        emu.lcd_bg[ 3 ] = ( val & 0xC0 ) >> 6;
        return;

      // OBP0
      case ( addr == 0xFF48 ):
        emu.lcd_obp0[ 0 ] = ( val & 0x03 ) >> 0;
        emu.lcd_obp0[ 1 ] = ( val & 0x0C ) >> 2;
        emu.lcd_obp0[ 2 ] = ( val & 0x30 ) >> 4;
        emu.lcd_obp0[ 3 ] = ( val & 0xC0 ) >> 6;
        return;

      // OBP1
      case ( addr == 0xFF49 ):
        emu.lcd_obp1[ 0 ] = ( val & 0x03 ) >> 0;
        emu.lcd_obp1[ 1 ] = ( val & 0x0C ) >> 2;
        emu.lcd_obp1[ 2 ] = ( val & 0x30 ) >> 4;
        emu.lcd_obp1[ 3 ] = ( val & 0xC0 ) >> 6;
        return;

      // WY
      case ( addr == 0xFF4A ):
        emu.lcd_wy = val & 0xFF;
        return;

      // WX
      case ( addr == 0xFF4B ):
        emu.lcd_wx = val & 0xFF;
        return;

      // DMG ROM enable
      case ( addr == 0xFF50 ):
        emu.lcd_ly      = 0x90;
        emu.nr[ 0x26 ]  = 0xF1;
        emu.boot_rom_enabled = false;
        return;

      // IE
      case ( addr == 0xFFFF ):
        emu.iePins   = ( val & 0x10 ) != 0x00;
        emu.ieSerial = ( val & 0x08 ) != 0x00;
        emu.ieTimer  = ( val & 0x04 ) != 0x00;
        emu.ieLCDC   = ( val & 0x02 ) != 0x00;
        emu.ieVBlank = ( val & 0x01 ) != 0x00;
        return;
    }
  };


  /**
   * Read an IO register
   */
  emu.io_read = function( addr )
  {
    var ret;

    switch ( true )
    {
      // P1
      case ( addr == 0xFF00 ):
        return emu.keys;

      // NR x
      case ( 0xFF10 <= addr && addr <= 0xFF26 ):
        return emu.nr[ addr - 0xFF00 ];

      // IF
      case ( addr == 0xFF0F ):
        ret |= emu.ifPins   ? 0x10 : 0x00;
        ret |= emu.ifSerial ? 0x08 : 0x00;
        ret |= emu.ifTimer  ? 0x04 : 0x00;
        ret |= emu.ifLCDC   ? 0x02 : 0x00;
        ret |= emu.ifVBlank ? 0x01 : 0x00;
        return ret;

      // LCDC
      case ( addr == 0xFF40 ):
        ret |= emu.lcd_enable                ? 0x80 : 0x00;
        ret |= emu.lcd_wnd_tilemap == 0x9C00 ? 0x40 : 0x00;
        ret |= emu.lcd_wnd_display           ? 0x20 : 0x00;
        ret |= emu.lcd_tile_data == 0x8000   ? 0x10 : 0x00;
        ret |= emu.lcd_bg_tilemap == 0x9C00  ? 0x08 : 0x00;
        ret |= emu.lcd_obj_size == 16        ? 0x04 : 0x00;
        ret |= emu.lcd_obj_display           ? 0x02 : 0x00;
        ret |= emu.lcd_bg_display            ? 0x01 : 0x00;
        return ret;

      // STAT
      case ( addr == 0xFF41 ):
        return;

      // SCY
      case ( addr == 0xFF42 ):
        return emu.lcd_scy;

      // SCX
      case ( addr == 0xFF43 ):
        return emu.lcd_scx;

      // LY
      case ( addr == 0xFF44 ):
        return emu.lcd_ly;

      // LYC
      case ( addr == 0xFF45 ):
        return;

      // DMA
      case ( addr == 0xFF46 ):
        return;

      // BGP
      case ( addr == 0xFF47 ):
        ret |= emu.lcd_bg[ 0 ] << 0;
        ret |= emu.lcd_bg[ 1 ] << 2;
        ret |= emu.lcd_bg[ 2 ] << 4;
        ret |= emu.lcd_bg[ 3 ] << 6;
        return ret;

      // OBP0
      case ( addr == 0xFF48 ):
        ret |= emu.lcd_obp0[ 0 ] << 0;
        ret |= emu.lcd_obp0[ 1 ] << 2;
        ret |= emu.lcd_obp0[ 2 ] << 4;
        ret |= emu.lcd_obp0[ 3 ] << 6;
        return;

      // OBP1
      case ( addr == 0xFF49 ):
        ret |= emu.lcd_obp1[ 0 ] << 0;
        ret |= emu.lcd_obp1[ 1 ] << 2;
        ret |= emu.lcd_obp1[ 2 ] << 4;
        ret |= emu.lcd_obp1[ 3 ] << 6;
        return;

      // WY
      case ( addr == 0xFF4A ):
        return emu.lcd_wy;

      // WX
      case ( addr == 0xFF4B ):
        return emu.lcd_wx;

      // IE
      case ( addr == 0xFFFF ):
        ret |= emu.iePins   ? 0x10 : 0x00;
        ret |= emu.ieSerial ? 0x08 : 0x00;
        ret |= emu.ieTimer  ? 0x04 : 0x00;
        ret |= emu.ieLCDC   ? 0x02 : 0x00;
        ret |= emu.ieVBlank ? 0x01 : 0x00;
        return ret;
    }
  };

  /**
   * ROM registers
   */
  emu.mbc1_reg = function( addr, val )
  {
    var tmp;

    switch ( true )
    {
      case ( 0x0000 <= addr && addr < 0x2000 ):
      {
        emu.rom_ram = val == 0x0A;
        return;
      }
      case ( 0x2000 <= addr && addr < 0x4000 ):
      {
        tmp = val & 0x1E;
        tmp = tmp ? tmp : 0x01;
        emu.rom_bank = ( emu.rom_bank & 0xE0 ) | tmp;

        for ( var idx = 0x4000; idx < 0x8000; ++idx )
        {
          emu.ram[ idx ] = emu.rom.data[ emu.rom_bank * 0x4000 + idx ];
        }

        return;
      }
      default:
      {
        log( "MBC1: " + addr.toString( 16 ) + " " + val.toString( 16 ) );
      }
    }
  }
} ) ( this.emu = this.emu || { } );
