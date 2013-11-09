// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.


/**
  * Initialises the CPU
  */
var CPU = function( ram )
{
	this.ram = ram;
  this.cycles = 0;

  var reg = {
    'a':  0x00,
    'f':  0x00,
    'af': 0x0000,
    'b':  0x00,
    'c':  0x00,
    'bc': 0x0000,
    'd':  0x00,
    'e':  0x00,
    'de': 0x0000,
    'h':  0x00,
    'l':  0x00,
    'hl': 0x0000,
    'pc': 0x0100,
    'sp': 0xFFFE
  };

  // Allows access sp and pc
  var accessReg16 = function( rr )
  {
    Object.defineProperty( this, rr, {
      get: function( )
      {
        return reg[ rr ];
      },
      set: function( n )
      {
        reg[ rr ] = n & 0xFFFF;
      }
    });
  }.bind( this );

  accessReg16( 'pc' );
  accessReg16( 'sp' );

  // Allows access 8 bit registers
  var accessReg8 = function( rr )
  {
    Object.defineProperty( this, rr[ 0 ], {
      get: function( )
      {
        return reg[ rr[ 0 ] ]
      },
      set: function( n )
      {
        reg[ rr[ 0 ] ] = n & 0xFF;
        reg[ rr ] = (reg[ rr ] & 0x00FF) | ( ( n & 0xFF) << 8 );
      }
    });

    Object.defineProperty( this, rr[ 1 ], {
      get: function( )
      {
        return reg[ rr[ 1 ] ]
      },
      set: function( n )
      {
        reg[ rr[ 1 ] ] = n & 0xFF;
        reg[ rr ] = (reg[ rr ] & 0xFF00) | ( n & 0xFF);
      }
    });

    Object.defineProperty( this, rr, {
      get: function( )
      {
        return reg[ rr ];
      },
      set: function( n )
      {
        reg[ rr ] = n & 0xFFFF;
        reg[ rr[ 0 ] ] = ( n & 0xFF00 ) >> 8;
        reg[ rr[ 1 ] ] = ( n & 0x00FF ) >> 0;
      }
    });
  }.bind( this );

  accessReg8( 'af' );
  accessReg8( 'bc' );
  accessReg8( 'de' );
  accessReg8( 'hl' );

  // Allows access to flags
  var accessFlag = function( f, bit )
  {
    Object.defineProperty( this, f, {
      get: function( )
      {
        return ( reg[ 'f' ] & ( 1 << bit ) ) != 0;
      },
      set: function( n )
      {
        if ( n ) {
          reg[ 'f' ] |= ( 1 << bit );
        } else {
          reg[ 'f' ] &= ~( 1 << bit );
        }
      }
    });
  }.bind( this );

  accessFlag( 'zf', 7 );
  accessFlag( 'nf', 6 );
  accessFlag( 'hf', 5 );
  accessFlag( 'cf', 4 );
}


/**
  * Executes a single CPU operation
  */
CPU.prototype.tick = function( )
{
  this.instr( this.ram.raw[ this.pc++ ] );
}


/**
 * Returns the 16-bit immediate operand
 */
CPU.prototype.get_nn = function( )
{
  return this.ram.raw[ this.pc++ ] | (this.ram.raw[ this.pc++ ] << 8);
}


/**
 * Returns the 8-bit displacement
 */
CPU.prototype.get_disp = function( )
{
  return this.ram.raw[ this.pc++ ];
}


/**
 * Executes an instruction
 */
CPU.prototype.instr = function( op )
{
  var x = ( op & 0xC0 ) >> 6;
  var y = ( op & 0x38 ) >> 3;
  var z = op & 7;
  var p = y >> 1;
  var q = y & 1;
  var disp, nn;

  switch ( true )
  {
    // NOP
    case ( op == 0x00 ):
      this.cycles += 4;
      return;

    // LD (bc), a
    case ( op == 0x02 ):
      this.cycles += 8;
      this.ram.set_byte( this.bc, this.a );
      return;

    // RLCA
    case ( op == 0x07 ):
      this.cycles += 4;
      this.cf = ( this.a & 0x80 ) != 0x00;
      this.nf = false;
      this.hf = false;
      this.zf = ( this.a <<= 1 ) == 0x00;
      return;

    // LD (nn), sp
    case ( op == 0x08 ):
      this.cycles += 20;
      this.ram.set_word( this.get_nn( ), this.sp );
      return;

    // LD a, (bc)
    case ( op == 0x0A ):
      this.cycles += 8;
      this.a = this.ram.get_byte( this.bc );
      return;

    // RRCA
    case ( op == 0x0F ):
      this.cycles += 4;
      this.cf = ( this.a & 0x01 ) != 0x00;
      this.nf = false;
      this.hf = false;
      this.zf = ( this.a >>= 1 ) == 0x00;
      return;

    // STOP
    case ( op == 0x10 ):
      this.cycles += 4;
      this.pc += 1;
      console.log( "Unimplemented: STOP" );
      return;

    // LD (de), a
    case ( op == 0x12 ):
      this.cycles += 8;
      this.ram.set_byte( this.de, this.a );
      return;

    // LD a, (de)
    case ( op == 0x1A ):
      this.cycles += 8;
      this.a = this.ram.get_byte( this.de );
      return;

    // RLA
    case ( op == 0x17 ):
      this.cycles += 4;
      this.cf = ( this.a & 0x80 ) != 0x00;
      this.nf = false;
      this.hf = false;

      if ( this.cf ) {
        this.a = ( ( this.a << 1) | 0x01 ) & 0xFF;
      } else {
        this.a = ( this.a << 1 ) & 0xFF;
      }

      this.zf = this.a == 0x00;
      return;

    // RRA
    case ( op == 0x1F ):
      this.cycles += 4;
      this.cf = ( this.a & 0x01 ) != 0x00;
      this.nf = false;
      this.hf = false;

      if ( this.cf ) {
        this.a = ( this.a >> 1) | 0x80;
      } else {
        this.a = this.a >> 1;
      }

      this.zf = this.a == 0x00;
      return;

    // JR n
    case ( op == 0x18 ):
      this.cycles += 8;

      disp = this.get_disp( );
      if ( disp & 0x80 ) {
        disp |= ~0xFF;
      }

      this.pc = ( this.pc + disp - 2 ) & 0xFFFF;
      return;

    // LDI (hl), a
    case ( op == 0x22 ):
      this.cycles += 8;
      this.ram.set_byte( this.hl, this.a );
      this.hl = ( this.hl + 1 ) & 0xFFFF;
      return;

    // DAA
    case ( op == 0x27 ):
      this.cycles += 4;

      var inc = 0x00, cf;
      if ( this.cf || this.a > 0x99 ) {
        inc |= 0x60;
        cf = true;
      } else {
        inc &= 0x0F;
        cf = false;
      }

      if ( this.hf || ( this.a & 0x0F ) > 0x09 ) {
        inc |= 0x06;
      }

      if ( this.nf ) {
        this.a = this.alu_sub_8( this.a, inc );
      } else {
        this.a = this.alu_add_8( this.a, inc );
      }

      this.zf = this.a == 0x00;
      this.hf = false;
      this.cf = cf;

      return;

    // CPL
    case ( op == 0x2F ):
      this.cycles += 4;
      this.a = ~this.a;
      return;

    // LDI a, (hl)
    case ( op == 0x2A ):
      this.cycles += 8;
      this.a = this.ram.get_byte( this.hl );
      this.hl = ( this.hl + 1 ) & 0xFFFF;
      return;

    // LDD (hl), a
    case ( op == 0x32 ):
      this.cycles += 8;
      this.ram.set_byte( this.hl, this.a );
      this.hl = ( this.hl - 1 ) & 0xFFFF;
      return;

    // LDD a, (hl)
    case ( op == 0x3A ):
      this.cycles += 8;
      this.a = this.ram.get_byte( this.hl );
      this.hl = ( this.hl - 1 ) & 0xFFFF;
      return;

    // SCF
    case ( op == 0x37 ):
      this.cycles += 4;
      this.nf = false;
      this.hf = false;
      this.cf = true;
      return;

    // CCF
    case ( op == 0x3F ):
      this.cycles += 4;
      this.nf = false;
      this.hf = false;
      this.cf = false;
      return;

    // HALT
    case ( op == 0x76 ):
      this.cycles += 4;
      console.log( "Unimplemented: HALT" );
      return;

    // CALL nn
    case ( op == 0xCD ):
      this.cycles += 12;
      this.ram.set_word( this.sp, ( this.pc + 2 ) & 0xFFFF );
      this.sp = ( this.sp - 2 ) & 0xFFFF;
      this.pc = this.get_nn( );
      return;

    // CB prefix
    case ( op == 0xCB ):
      console.log( "CB prefix" );
      return;

    // LDH (n), a
    case ( op == 0xE0 ):
      this.cycles += 12;
      this.ram.set_byte( 0xFF00 + this.get_disp( ), this.a );
      return;

    // ADD sp, n
    case ( op == 0xE8 ):
      this.cycles += 16;
      disp = this.get_disp( );

      if ( disp & 0x80 ) {
        disp |= ~0xFF;
      }

      this.sp = this.alu_add_16( this.sp, disp );
      this.zf = false;
      this.nf = false;
      return;

    // JP (hl)
    case ( op == 0xE9 ):
      this.cycles += 4;
      this.pc = this.hl;
      return;

    // LD (nn), a
    case ( op == 0xEA ):
      this.cycles += 16;
      this.ram.set_byte( this.get_nn( ), this.a );
      return;

    // JP nn
    case ( op == 0xC3 ):
      this.cycles += 12;
      this.pc = this.get_nn( );
      return;

    // RET
    case ( op == 0xC9 ):
      this.cycles += 8;
      this.sp = ( this.sp + 2 ) & 0xFFFF;
      this.pc = this.ram.get_word( this.sp );
      return;

    // RETI
    case ( op == 0xD9 ):
      this.cycles += 8;
      console.log( "Not implemented: RETI" );
      return;

    // LDH a, (n)
    case ( op == 0xF0 ):
      this.cycles += 12;
      this.a = this.ram.get_byte( 0xFF00 + this.get_disp( ) );
      return;

    // DI
    case ( op == 0xF3 ):
      this.cycles += 4;
      console.log( "Not implemented: DI" );
      return;

    // LDHL sp, n
    case ( op == 0xF8 ):
      this.cycles += 12;
      disp = this.get_disp( );
      if ( disp & 0x80 ) {
        disp |= ~0xFF;
      }

      this.hl = this.alu_add_16( sp, disp );
      this.zf = false;
      this.nf = false;
      return;

    // LD sp, hl
    case ( op == 0xF9 ):
      this.cycles += 8;
      this.sp = this.hl;
      return;

    // EI
    case ( op == 0xFB ):
      this.cycles += 4;
      console.log( "Not implemented: EI" );
      return;

    // LD a, (nn)
    case ( op == 0xFA ):
      this.cycles += 16;
      this.a = this.ram.get_byte( this.get_nn( ) );
      return;

    // LD r[y], r[z]
    case ( ( op & 0xC0 ) == 0x40 ):
      this.cycles += 4;
      if ( y == 0x6 || z == 0x6 ) {
        this.cycles += 4;
      }

      this.set_r( y, this.get_r( z ) );
      return;

    // ALU[y] r[z]
    case ( ( op & 0xC0 ) == 0x80 ):
      this.cyles += 4;
      if ( z == 0x06 ) {
        this.cycles += 4;
      }

      this.alu_8( y, this.get_r( z ) );
      return;

    // INC r[p]
    case ( ( op & 0xC7 ) == 0x04 ):
      this.cycles += y == 0x6 ? 12 : 4;
      this.set_r( y, ( this.get_r( y ) + 1 ) & 0xFF );
      return;

    // DEC r[p]
    case ( ( op & 0xC7 ) == 0x05 ):
      this.cycles += y == 0x6 ? 12 : 4;
      this.set_r( y, ( this.get_r( y ) - 1 ) & 0xFF );
      return;

    // LD r[y], n
    case ( ( op & 0xC7 ) == 0x06 ):
      this.cycles += 8;
      if ( y == 0x6) {
        this.cycles += 4;
      }

      this.set_r( y, this.get_disp( ) );
      return;

    // ALU[y] n
    case ( ( op & 0xC7 ) == 0xC6 ):
      this.cyles += 4;
      if ( z == 0x06 ) {
        this.cycles += 4;
      }

      this.alu_8( y, this.get_disp( ) );
      return;

    // RST y * 8
    case ( ( op & 0xC7 ) == 0xC7 ):
      this.cycles += 32;
      this.ram.set_word( this.sp, this.pc );
      this.sp = ( this.sp + 2 ) & 0xFFFF;
      this.pc = y << 3;
      return;

    // LD rp[p], nn
    case ( ( op & 0xCF) == 0x01 ):
      this.cycles += 12;
      this.set_rp( p, this.get_nn( ) );
      return;

    // INC rp[p]
    case ( ( op & 0xCF ) == 0x03 ):
      this.cycles += 8;
      this.set_rp( p, ( this.get_rp( p ) + 1 ) & 0xFFFF );
      return;

    // DEC rp[p]
    case ( (op & 0xCF ) == 0x0B ):
      this.cycles += 8;
      this.set_rp( p, ( this.get_rp( p ) - 1 ) & 0xFFFF );
      return;

    // ADD hl, rp[p]
    case ( ( op & 0xCF ) == 0x09 ):
      this.cycles += 8;
      this.hl = this.alu_add_16( this.hl, this.get_rp( p ) );
      return;

    // POP nn
    case ( ( op & 0xCF ) == 0xC1 ):
      this.cycles += 12;
      this.sp = ( this.sp + 2 ) & 0xFFFF;

      switch ( p ) {
        case 0x0: this.bc = this.ram.get_word( this.sp ); break;
        case 0x1: this.de = this.ram.get_word( this.sp ); break;
        case 0x2: this.hl = this.ram.get_word( this.sp ); break;
        case 0x3: this.af = this.ram.get_word( this.sp ); break;
      }

      return;

    // PUSH nn
    case ( ( op & 0xCF ) == 0xC5 ):
      this.cycles += 16;
      switch ( p ) {
        case 0x0: this.ram.set_word( this.sp, this.bc ); break;
        case 0x1: this.ram.set_word( this.sp, this.de ); break;
        case 0x2: this.ram.set_word( this.sp, this.hl ); break;
        case 0x3: this.ram.set_word( this.sp, this.af ); break;
      }

      this.sp = ( this.sp - 2 ) & 0xFFFF;
      return;

    // JR cc, n
    case ( ( op & 0xE7 ) == 0x20 ):
      this.cycles += 8;

      disp = this.get_disp( );
      if ( disp & 0x80 ) {
        disp |= ~0xFF;
      }

      if ( this.check_cond( y - 4 ) ) {
        this.cycles += 4;
        this.pc = ( this.pc + disp - 2 ) & 0xFFFF;
      }

      return;

    // RET cc
    case ( ( op & 0xE7 ) == 0xC0 ):
      this.cycles += 8;

      if ( this.check_cond( y ) ) {
        this.cycles += 12;
        this.sp = ( this.sp + 2 ) & 0xFFFF;
        this.pc = this.ram.get_word( this.sp );
      }

      return;

    // JP cc, nn
    case ( ( op & 0xE7 ) == 0xC2 ):
      this.cycles += 12;
      nn = this.get_nn( );
      if ( this.check_cond( y ) ) {
        this.cycles += 4;
        this.pc = nn;
      }
      return;

    // CALL cc[y], nn
    case ( ( op & 0xE7 ) == 0xC4 ):
      this.cycles += 12;
      nn = this.get_nn( );
      if ( this.check_cond( y ) ) {
        this.cycles += 12;
        this.pc = nn;
      }
      return;

    default:
      throw "Invalid opcode: 0x" + op.toString( 16 );
  }
}


/**
 * Check a condition flag
 */
CPU.prototype.check_cond = function( y )
{
  switch ( y )
  {
    case 0: return !this.zf;
    case 1: return this.zf;
    case 2: return !this.cf;
    case 3: return this.cf;
  }
}


/**
 * Sets the value of a register
 */
CPU.prototype.set_r = function( r, v )
{
  switch ( r )
  {
    case 0x0: this.b = v; return;
    case 0x1: this.c = v; return;
    case 0x2: this.d = v; return;
    case 0x3: this.e = v; return;
    case 0x4: this.h = v; return;
    case 0x5: this.l = v; return;
    case 0x7: this.a = v; return;
    case 0x6: this.ram.set_byte( this.hl, v ); return;
  }
}

/**
 * Return the value of a register
 */
CPU.prototype.get_r = function( r )
{
  switch ( r )
  {
    case 0x0: return this.b;
    case 0x1: return this.c;
    case 0x2: return this.d;
    case 0x3: return this.e;
    case 0x4: return this.h;
    case 0x5: return this.l;
    case 0x7: return this.a;
    case 0x6: return this.ram.get_byte( this.hl );
  }
}


/**
 * Set the value of a register pair
 */
CPU.prototype.set_rp = function( rr, v )
{
  switch( rr )
  {
    case 0x0: this.bc = v; return;
    case 0x1: this.de = v; return;
    case 0x2: this.hl = v; return;
    case 0x3: this.sp = v; return;
  }
}


/**
 * Returns the value of a register pair
 */
CPU.prototype.get_rp = function( rr )
{
  switch( rr )
  {
    case 0x0: return this.bc;
    case 0x1: return this.de;
    case 0x2: return this.hl;
    case 0x3: return this.sp;
  }
}


/**
 * Initialises ALU operations
 */
CPU.prototype.alu_8 = function( y, n )
{
  switch ( y )
  {
    // ADD n
    case 0:
      this.a = this.alu_add_8( this.a, n );
      return;

    // ADC n
    case 1:
      if ( this.cf ) {
        n = ( n + 1 ) & 0xFF;
      }
      this.a = this.alu_add_8( this.a, n );
      return;

    // SUB n
    case 2:
      this.a = this.alu_sub_8( this.a, n );
      return;

    // SBC n
    case 3:
      if ( this.cf ) {
        n = ( n + 1 ) & 0xFF;
      }
      this.a = this.alu_sub_8( this.a, n );
      return;

    // AND n
    case 4:
      this.a = ( this.a & n ) & 0xFF;

      this.zf = this.a == 0;
      this.nf = false;
      this.hf = true;
      this.cf = false;

      return;

    // XOR n
    case 5:
      this.a = ( this.a ^ n ) & 0xFF;

      this.zf = this.a == 0;
      this.nf = false;
      this.hf = false;
      this.cf = false;

      return;

    // OR n
    case 6:
      this.a = ( this.a | n ) & 0xFF;

      this.zf = this.a == 0;
      this.nf = false;
      this.hf = false;
      this.cf = false;

      return;

    // CP n
    case 7:
      this.alu_sub_8( this.a, n );
      return;
  }
}

/**
 * Sets the flags after an 8 bit ADD
 */
CPU.prototype.alu_add_8 = function( a, b )
{
  var a8 = ( a >>> 0 ) & 0x0FF;
  var b8 = ( b >>> 0 ) & 0x0FF;
  var r9 = ( a8 + b8 ) & 0x1FF;

  var a4 = ( a >>> 0 ) & 0x0F;
  var b4 = ( b >>> 0 ) & 0x0F;
  var r5 = ( a4 + b4 ) & 0x1F;

  this.zf = ( r9 & 0xFF ) == 0x00;
  this.nf = false;
  this.hf = ( r5 & 0x010 ) != 0x00;
  this.cf = ( r9 & 0x100 ) != 0x00;

  return r9 & 0xFF;
}


/**
 * Sets the flags after a 16 bit ADD
 */
CPU.prototype.alu_add_16 = function( a, b )
{
  var a16 = ( a >>> 0 ) & 0x0FFFF;
  var b16 = ( b >>> 0 ) & 0x0FFFF;
  var r17 = ( a16 + b16 ) & 0x1FFFF;

  var a12 = ( a >>> 0 ) & 0x0FFF;
  var b12 = ( a >>> 0 ) & 0x0FFF;
  var r13 = ( a12 + b12 ) & 0x1FFF;

  this.zf = ( r17 & 0xFFFF ) == 0x0000;
  this.nf = false;
  this.hf = ( r13 & 0x01000 ) != 0x00000;
  this.cf = ( r17 & 0x10000 ) != 0x00000;

  return r17 & 0xFFFF;
}


/**
 * Sets the flags after an 8 bit SUB
 */
CPU.prototype.alu_sub_8 = function( a, b )
{
  var a8 = ( a >>> 0 ) & 0xFF;
  var b8 = ( ( ~b >>> 0 ) + 1 ) & 0xFF;
  var r9 = ( a8 + b8 ) & 0x1FF;

  var a4 = ( a >>> 0 ) & 0xF;
  var b4 = ( ( ~b >>> 0 ) + 1 ) & 0xF;
  var r5 = ( a4 + b4 ) & 0x1F;

  this.zf = ( r9 & 0x0FF ) == 0x00;
  this.nf = true;
  this.hf = ( r5 & 0x010 ) == 0x00;
  this.cf = ( r9 & 0x100 ) == 0x00;

  return r9 & 0xFF;
}

/**
 * Prints a log message
 */
CPU.prototype.log = function( msg )
{
  console.log( msg );
}