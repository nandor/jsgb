/**
 * This file is part of the JavaScript GameBoy emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function ( emu )
{
  // Internal memory
  emu.ram = new Uint8Array( 0x10000 );
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
    for ( var i = 0; i <= 0xFFFF; ++i )
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
    switch ( true ) {
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
        //console.log( "Read from video memory" );
        return 0;
      }

      // Switchable RAM bank
      case ( 0xA000 <= addr && addr < 0xC000 ):
      {
        //console.log( "Read from switchable RAM" );
        return 0;
      }

      // Internal RAM & echo
      case ( 0xC000 <= addr && addr < 0xFE00 ):
      {
        return emu.ram[ addr ];
      }

      // Sprite attrib memory
      case ( 0xFE00 <= addr && addr < 0xFEA0 ):
      {
        // console.log( "Read from Sprite attrib memory" );
        return 0;
      }

      // IO ports
      case ( 0xFF00 <= addr && addr < 0xFF80 ):
      {
        emu.io_read( addr );
        return 0;
      }

      // Hight RAM area
      case ( 0xFF80 <= addr && addr < 0xFFFF ):
      {
        return emu.ram[ addr ];
      }

      // Enable interrupts register
      case ( addr == 0xFFFF ):
      {
        console.log( "Read enable interrupts" );
        return 0;
      }
    }

    throw "Reserved memory at 0x" + addr.toString( 16 );
  }

  /**
   * Sets the value of a single byte in memory
   */
  emu.set_byte = function( addr, val )
  {
    switch ( true ) {
      // Video RAM
      case ( 0x8000 <= addr && addr < 0xA000 ):
      {
        //console.log( "Write to video memory: " + addr.toString( 16 ) );
        return;
      }

      // Switchable RAM bank
      case ( 0xA000 <= addr && addr < 0xC000 ):
      {
        console.log( "Write to switchable RAM" );
        return;
      }

      // Internal RAM
      case ( 0xC000 <= addr && addr < 0xE000 ):
      {
        emu.ram[ addr ] = val & 0xFF;

        if ( addr + 0x4000 < 0xFE00 ) {
          emu.ram[ addr + 0x4000 ] = val & 0xFF;
        }
        return;
      }

      // Echo of internal RAM
      case ( 0xE000 <= addr && addr < 0xFE00 ):
      {
        emu.ram[ addr ] = val & 0xFF;
        emu.ram[ addr - 0x4000 ] = val & 0xFF;
        return;
      }

      // Sprite attrib memory
      case ( 0xFE00 <= addr && addr < 0xFEA0 ):
      {
        // console.log( "Sprite attrib memory" );
        return;
      }

      // IO ports
      case ( 0xFF00 <= addr && addr < 0xFF80 ):
      {
        postMessage( addr.toString( 16 ) );
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
        // console.log( "Write enable interrupts: " + val.toString( 16 ) );
        return;
      }
    }

    throw "Reserved memory: 0x" + addr.toString( 16 );
  }


  /**
   * Write a value to an IO register
   */
  emu.io_write = function( addr, value )
  {
    switch ( addr )
    {
      // LCDC
      case 0xFF40:
        return;

      // STAT
      case 0xFF41:
        return;

      // SCY
      case 0xFF42:
        return;

      // SCX
      case 0xFF43:
        return;

      // LY
      case 0xFF44:
        throw "IO register LY is read only";

      // LYC
      case 0xFF45:
        return;

      // DMA
      case 0xFF46:
        return;

      // BGP
      case 0xFF47:
        return;

      // OBP0
      case 0xFF48:
        return;

      // OBP1
      case 0xFF49:
        return;

      // WY
      case 0xF4A:
        return;

      // WX
      case 0xF4B:
        return;
    }
  };


  /**
   * Read an IO register
   */
  emu.io_read = function( addr, value )
  {

  };
} ) ( this.emu = this.emu || { } );
