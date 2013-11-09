// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.

var RAM = function( )
{
  this.raw = new Uint8Array( 0x10000 );
}

RAM.prototype.load_rom = function( rom )
{
  for ( var i = 0; i <= 0xFFFF; ++i )
  {
    this.raw[ i ] = rom.data[ i ];
  }
}

RAM.prototype.get_word = function( addr )
{
  var b0, b1;

  b0 = this.get_byte( addr );
  b1 = this.get_byte( addr + 1 );

  return b0 | ( b1 << 8 );
}

RAM.prototype.set_word = function( addr, v )
{
  this.set_byte( addr, v & 0xFF );
  this.set_byte( addr + 1, ( v >> 8 ) & 0xFF );
}

/**
 * Returns the value of a single byte of memory
 */
RAM.prototype.get_byte = function( addr )
{
  switch ( true ) {
    // ROM
    case ( 0x0000 <= addr && addr < 0x8000 ):
    {
      return this.raw[ addr ];
    }

    // Video RAM
    case ( 0x8000 <= addr && addr < 0xA000 ):
    {
      console.log( "Read from video memory" );
      return 0;
    }

    // Switchable RAM bank
    case ( 0xA000 <= addr && addr < 0xC000 ):
    {
      console.log( "Read from switchable RAM" );
      return 0;
    }

    // Internal RAM & echo
    case ( 0xC000 <= addr && addr < 0xFE00 ):
    {
      return this.raw[ addr ];
    }

    // Sprite attrib memory
    case ( 0xFE00 <= addr && addr < 0xFEA0 ):
    {
      console.log( "Read from Sprite attrib memory" );
      return 0;
    }

    // IO ports
    case ( 0xFF00 <= addr && addr < 0xFF80 ):
    {
      console.log( "IO ports: " + addr.toString( 16 ));
      return 0;
    }

    // Hight RAM area
    case ( 0xFF80 <= addr && addr < 0xFFFF ):
    {
      return this.raw[ addr ];
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
RAM.prototype.set_byte = function( addr, val )
{
  switch ( true ) {
    // Video RAM
    case ( 0x8000 <= addr && addr < 0xA000 ):
    {
      console.log( "Write to video memory" );
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
      this.raw[ addr ] = val & 0xFF;

      if ( addr + 0x4000 < 0xFE00 ) {
        this.raw[ addr + 0x4000 ] = val & 0xFF;
      }
      return;
    }

    // Echo of internal RAM
    case ( 0xE000 <= addr && addr < 0xFE00 ):
    {
      this.raw[ addr ] = val & 0xFF;
      this.raw[ addr - 0x4000 ] = val & 0xFF;
      return;
    }

    // Sprite attrib memory
    case ( 0xFE00 <= addr && addr < 0xFEA0 ):
    {
      console.log( "Sprite attrib memory" );
      return;
    }

    // IO ports
    case ( 0xFF00 <= addr && addr < 0xFF80 ):
    {
      console.log( "IO ports: " + addr.toString( 16 ) );
      return;
    }

    // High RAM area
    case ( 0xFF80 <= addr && addr < 0xFFFF ):
    {
      this.raw[ addr ] = val & 0xFF;
      return;
    }

    // Enable interrupts register
    case ( addr == 0xFFFF ):
    {
      console.log( "Write enable interrupts" );
      return;
    }
  }

  throw "Reserved memory: 0x" + addr.toString( 16 );
}
