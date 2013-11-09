// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.

var ROM = function( data )
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
  this.cartridge_type    = this.data[ 0x0147 ];
  this.data_size          = 0;
  this.ram_size          = 0;
  this.dest_code         = this.data[ 0x014A ];
  this.old_licensee_code = this.data[ 0x014B ];
  this.version_number    = this.data[ 0x014C ];
  this.header_sum        = this.data[ 0x014D ];
  this.data_sum           = this.data[ 0x014F ] | (this.data[ 0x014E ] << 8);

  this.read_title( );
  this.read_manuf_code( );
  this.read_new_licensee_code( );
  this.read_data_size( );
  this.read_ram_size( );

  this.check_header( );
  this.check_data( );
}

ROM.prototype.check_header = function( )
{
  var sum = 0;
  for ( var i = 0x0134; i <= 0x014C; ++i ) {
    sum = sum - this.data[ i ] - 1;
  }

  if ( ( sum & 0xFF ) != this.header_sum ) {
    throw "Header checksum mismatch 0x" + ( sum & 0xFF ).toString( 16 );
  }
}

ROM.prototype.check_data = function( )
{
  var sum = 0;
  for ( var i = 0x0000; i < this.data.length; ++i ) {
    if ( i != 0x014E && i != 0x014F ) {
      sum += this.data[ i ];
    }
  }

  if ( (sum & 0xFFFF) != this.data_sum ) {
    throw "Header checksum mismatch 0x" + ( sum & 0xFFFF).toString( 16 );
  }
}

ROM.prototype.read_title = function( )
{
  this.title = "";
  for ( var i = 0x0134; i < 0x013F && this.data[ i ]; ++i ) {
    this.title += String.fromCharCode( this.data[ i ] );
  }
}


ROM.prototype.read_manuf_code = function( )
{
  this.manuf_code = String.fromCharCode(
    this.data[ 0x013F ], this.data[ 0x0140 ],
    this.data[ 0x0141 ], this.data[ 0x0142 ]
  );
}


ROM.prototype.read_new_licensee_code = function( )
{
  this.new_licensee_code = String.fromCharCode(
    this.data[ 0x0144 ], this.data[ 0x0145 ]
  );
}

ROM.prototype.read_data_size = function( )
{
  switch ( this.data[ 0x0148 ] ) {
    case 0x00: this.data_size =  32 << 10; break;
    case 0x01: this.data_size =  64 << 10; break;
    case 0x02: this.data_size = 128 << 10; break;
    case 0x03: this.data_size = 256 << 10; break;
    case 0x04: this.data_size = 512 << 10; break;
    case 0x05: this.data_size =   1 << 20; break;
    case 0x06: this.data_size =   2 << 20; break;
    case 0x07: this.data_size =   4 << 20; break;
    case 0x52: this.data_size =  72 << 15; break;
    case 0x53: this.data_size =  80 << 15; break;
    case 0x54: this.data_size =  96 << 15; break;
    default:
      throw "Invalid ROM size: 0x" + this.data[ 0x0148 ].toString( 16 );
  }

  if ( this.data.length != this.data_size ) {
    throw "ROM size mismatch";
  }
}

ROM.prototype.read_ram_size = function( )
{
  switch ( this.data[ 0x149 ] ) {
    case 0x00: this.ram_size =  0 << 10; break;
    case 0x01: this.ram_size =  2 << 10; break;
    case 0x02: this.ram_size =  8 << 10; break;
    case 0x03: this.ram_size = 32 << 10; break;
    default:
      throw "Invalid ram size: 0x" + this.data[ 0x0149 ].toString( 16 );
  }
}
