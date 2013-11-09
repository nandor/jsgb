// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.


( function ( emu )
{
  emu.cycles = 0;
  emu.halted = false;

  // Interrupt enable register
  emu.iePins   = false;
  emu.ieSerial = false;
  emu.ieTimer  = false;
  emu.ieLCDC   = false;
  emu.ieStat   = false;

  // Registers
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
    'pc': 0x0000,
    'sp': 0xFFFE
  };

  // Allows access sp and pc
  var accessReg16 = function( rr )
  {
    Object.defineProperty( emu, rr, {
      get: function( )
      {
        return reg[ rr ];
      },
      set: function( n )
      {
        reg[ rr ] = n & 0xFFFF;
      }
    });
  }.bind( emu );

  // Allows access 8 bit registers
  var accessReg8 = function( rr )
  {
    Object.defineProperty( emu, rr[ 0 ], {
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

    Object.defineProperty( emu, rr[ 1 ], {
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

    Object.defineProperty( emu, rr, {
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
  }.bind( emu );


  // Allows access to flags
  var accessFlag = function( f, bit )
  {
    Object.defineProperty( emu, f, {
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
  }.bind( emu );


  accessReg16( 'pc' );
  accessReg16( 'sp' );
  accessReg8( 'af' );
  accessReg8( 'bc' );
  accessReg8( 'de' );
  accessReg8( 'hl' );
  accessFlag( 'zf', 7 );
  accessFlag( 'nf', 6 );
  accessFlag( 'hf', 5 );
  accessFlag( 'cf', 4 );


  /**
   * Sets the flags after an 8 bit ADD
   */
  var alu_add_8 = function( a, b )
  {
    var a8 = ( a >>> 0 ) & 0x0FF;
    var b8 = ( b >>> 0 ) & 0x0FF;
    var r9 = ( a8 + b8 ) & 0x1FF;

    var a4 = ( a >>> 0 ) & 0x0F;
    var b4 = ( b >>> 0 ) & 0x0F;
    var r5 = ( a4 + b4 ) & 0x1F;

    emu.zf = ( r9 & 0xFF ) == 0x00;
    emu.nf = false;
    emu.hf = ( r5 & 0x010 ) != 0x00;
    emu.cf = ( r9 & 0x100 ) != 0x00;

    return r9 & 0xFF;
  }

  /**
   * Sets the flags after an 8 bit SUB
   */
  var alu_sub_8 = function( a, b )
  {
    var a8 = ( a >>> 0 ) & 0xFF;
    var b8 = ( ( ~b >>> 0 ) + 1 ) & 0xFF;
    var r9 = ( a8 + b8 ) & 0x1FF;

    var a4 = ( a >>> 0 ) & 0xF;
    var b4 = ( ( ~b >>> 0 ) + 1 ) & 0xF;
    var r5 = ( a4 + b4 ) & 0x1F;

    emu.zf = ( r9 & 0x0FF ) == 0x00;
    emu.nf = true;
    emu.hf = ( r5 & 0x010 ) == 0x00;
    emu.cf = ( r9 & 0x100 ) == 0x00;

    return r9 & 0xFF;
  }


  /**
   * Sets the flags after a 16 bit ADD
   */
  var alu_add_16 = function( a, b )
  {
    var a16 = ( a >>> 0 ) & 0x0FFFF;
    var b16 = ( b >>> 0 ) & 0x0FFFF;
    var r17 = ( a16 + b16 ) & 0x1FFFF;

    var a12 = ( a >>> 0 ) & 0x0FFF;
    var b12 = ( a >>> 0 ) & 0x0FFF;
    var r13 = ( a12 + b12 ) & 0x1FFF;

    emu.zf = ( r17 & 0xFFFF ) == 0x0000;
    emu.nf = false;
    emu.hf = ( r13 & 0x01000 ) != 0x00000;
    emu.cf = ( r17 & 0x10000 ) != 0x00000;

    return r17 & 0xFFFF;
  }


  /**
   * Sign extend an 8 bit number
   */
  var alu_extend_8 = function( n )
  {
    if ( ( n & 0x80 ) != 0x80 )
      return n;

    return ( n & 0xFF ) | ( ~0xFF );
  }

  /**
   * Sign extend a 16 bit number
   */
  var alu_extend_16 = function( n )
  {
    if ( ( n & 0x8000 ) != 0x8000 )
      return n;

    return ( n & 0xFFFF ) | ( ~0xFFFF );
  }


  /**
   * Sets the value of a register
   */
  var set_r = function( r, v )
  {
    switch ( r )
    {
      case 0x0: emu.b = v; return;
      case 0x1: emu.c = v; return;
      case 0x2: emu.d = v; return;
      case 0x3: emu.e = v; return;
      case 0x4: emu.h = v; return;
      case 0x5: emu.l = v; return;
      case 0x7: emu.a = v; return;
      case 0x6: emu.set_byte( emu.hl, v ); return;
    }
  }

  /**
   * Return the value of a register
   */
  var get_r = function( r )
  {
    switch ( r )
    {
      case 0x0: return emu.b;
      case 0x1: return emu.c;
      case 0x2: return emu.d;
      case 0x3: return emu.e;
      case 0x4: return emu.h;
      case 0x5: return emu.l;
      case 0x7: return emu.a;
      case 0x6: return emu.get_byte( emu.hl );
    }
  }


  /**
   * Set the value of a register pair
   */
  var set_rp = function( rr, v )
  {
    switch( rr )
    {
      case 0x0: emu.bc = v; return;
      case 0x1: emu.de = v; return;
      case 0x2: emu.hl = v; return;
      case 0x3: emu.sp = v; return;
    }
  }


  /**
   * Returns the value of a register pair
   */
  var get_rp = function( rr )
  {
    switch( rr )
    {
      case 0x0: return emu.bc;
      case 0x1: return emu.de;
      case 0x2: return emu.hl;
      case 0x3: return emu.sp;
    }
  }

  /**
   * Check a condition flag
   */
  var check_cond = function( y )
  {
    switch ( y )
    {
      case 0: return !emu.zf;
      case 1: return emu.zf;
      case 2: return !emu.cf;
      case 3: return emu.cf;
    }
  }

  /**
   * Initialises ALU operations
   */
  var alu_8 = function( y, n )
  {
    switch ( y )
    {
      // ADD n
      case 0:
      {
        emu.a = alu_add_8( emu.a, n );
        return;
      }

      // ADC n
      case 1:
      {
        if ( emu.cf )
          n = ( n + 1 ) & 0xFF;

        emu.a = alu_add_8( emu.a, n );
        return;
      }

      // SUB n
      case 2:
      {
        emu.a = alu_sub_8( emu.a, n );
        return;
      }

      // SBC n
      case 3:
      {
        if ( emu.cf )
          n = ( n + 1 ) & 0xFF;

        emu.a = alu_sub_8( emu.a, n );
        return;
      }

      // AND n
      case 4:
      {
        emu.a = ( emu.a & n ) & 0xFF;

        emu.zf = emu.a == 0;
        emu.nf = false;
        emu.hf = true;
        emu.cf = false;

        return;
      }

      // XOR n
      case 5:
      {
        emu.a = ( emu.a ^ n ) & 0xFF;

        emu.zf = emu.a == 0;
        emu.nf = false;
        emu.hf = false;
        emu.cf = false;

        return;
      }

      // OR n
      case 6:
      {
        emu.a = ( emu.a | n ) & 0xFF;

        emu.zf = emu.a == 0;
        emu.nf = false;
        emu.hf = false;
        emu.cf = false;

        return;
      }

      // CP n
      case 7:
      {
        alu_sub_8( emu.a, n );
        return;
      }
    }
  }


  /**
   * 8 bit rotations
   */
  var alu_rot_8 = function( y, z )
  {
    var r, c;

    switch ( y )
    {
      // RLC n
      case 0x0:
        r = get_r( z );
        c = ( r & 0x80 ) >> 7;

        this.cf = cf != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r <<= 1 ) | c) != 0x00;

        set_r( z, r );
        return;

      // RRC n
      case 0x1:
        r = get_r( z );
        c = ( r & 0x01 ) << 7;

        this.cf = c != 0x80;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r >>= 1 ) | c ) != 0x00;

        set_r( z, r );
        return;

      // RL n
      case 0x2:
        r = get_r( z );
        c = this.cf ? 1 : 0;

        this.cf = ( y & 0x80 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r <<= 1 ) | c ) != 0x00;

        set_r( z, r );
        return;

      // RR n
      case 0x3:
        r = get_r( z );
        c = this.cf ? 1 : 0;

        this.cf = ( y & 0x01 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r >>= 1 ) | c ) != 0x00;

        set_r( z, r );
        return;

      // SLA n
      case 0x4:
        r = get_r( z );

        this.cf = ( r & 0x80 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r <<= 1 ) | ( r & 0x01 ) ) == 0x00;

        set_r( z, r );
        return;

      // SRA n
      case 0x5:
        r = get_r( z );

        this.cf = ( r & 0x1 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( ( r >>= 1 ) | ( r & 0x80 ) ) == 0x00;

        set_r( z, r );
        return;

      // SLL
      case 0x6:
        r = get_r( z );

        this.cf = ( y & 0x80 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( r <<= 1 ) == 0x00;

        set_r( z, r );
        return;

      // SRL
      case 0x7:
        r = get_r( z );

        this.cf = ( r & 0x01 ) != 0x00;
        this.nf = false;
        this.hf = false;
        this.zf = ( r >>= 1 ) == 0x00;

        set_r( z, r );
        return;
    }
  }


  /**
   * Executes an instruction
   */
  var instr = function( op )
  {
    var x = ( op & 0xC0 ) >> 6;
    var y = ( op & 0x38 ) >> 3;
    var z = op & 7;
    var p = y >> 1;
    var q = y & 1;

    var u8 = emu.get_byte( emu.pc );
    var s8 = alu_extend_8( u8 );
    var u16 = emu.get_word( emu.pc );
    var s16 = alu_extend_16( u16 );

    switch ( true )
    {
      // NOP
      case ( op == 0x00 ):
        emu.cycles += 4;
        return;

      // LD (bc), a
      case ( op == 0x02 ):
        emu.cycles += 8;
        emu.set_byte( emu.bc, emu.a );
        return;

      // RLCA
      case ( op == 0x07 ):
        emu.cycles += 4;

        var c = this.cf ? 0x01 : 0x00;

        emu.cf = ( emu.a & 0x80 ) != 0x00;
        emu.nf = false;
        emu.hf = false;
        emu.zf = ( ( emu.a <<= 1 ) | c2 ) == 0x00;
        return;

      // LD (nn), sp
      case ( op == 0x08 ):
        emu.cycles += 20;
        emu.pc += 2;
        emu.set_word( u16, emu.sp );
        return;

      // LD a, (bc)
      case ( op == 0x0A ):
        emu.cycles += 8;
        emu.a = emu.get_byte( emu.bc );
        return;

      // RRCA
      case ( op == 0x0F ):
        emu.cycles += 4;

        var c = this.cf ? 0x80 : 0x00;

        emu.cf = ( emu.a & 0x01 ) != 0x00;
        emu.nf = false;
        emu.hf = false;
        emu.zf = ( ( emu.a >>= 1 ) | c ) == 0x00;
        return;

      // STOP
      case ( op == 0x10 ):
        emu.cycles += 4;
        emu.pc += 1;
        console.log( "Unimplemented: STOP" );
        return;

      // LD (de), a
      case ( op == 0x12 ):
        emu.cycles += 8;
        emu.set_byte( emu.de, emu.a );
        return;

      // LD a, (de)
      case ( op == 0x1A ):
        emu.cycles += 8;
        emu.a = emu.get_byte( emu.de );
        return;

      // RLA
      case ( op == 0x17 ):
        emu.cycles += 4;
        emu.cf = ( emu.a & 0x80 ) != 0x00;
        emu.nf = false;
        emu.hf = false;

        if ( emu.cf ) {
          emu.a = ( ( emu.a << 1) | 0x01 ) & 0xFF;
        } else {
          emu.a = ( emu.a << 1 ) & 0xFF;
        }

        emu.zf = emu.a == 0x00;
        return;

      // RRA
      case ( op == 0x1F ):
        emu.cycles += 4;
        emu.cf = ( emu.a & 0x01 ) != 0x00;
        emu.nf = false;
        emu.hf = false;

        if ( emu.cf ) {
          emu.a = ( emu.a >> 1) | 0x80;
        } else {
          emu.a = emu.a >> 1;
        }

        emu.zf = emu.a == 0x00;
        return;

      // JR n
      case ( op == 0x18 ):
        emu.cycles += 8;
        emu.pc = ( emu.pc + s8 - 1 ) & 0xFFFF;
        return;

      // LDI (hl), a
      case ( op == 0x22 ):
        emu.cycles += 8;
        emu.set_byte( emu.hl, emu.a );
        emu.hl = ( emu.hl + 1 ) & 0xFFFF;
        return;

      // DAA
      case ( op == 0x27 ):
        emu.cycles += 4;

        var inc = 0x00, cf;
        if ( emu.cf || emu.a > 0x99 ) {
          inc |= 0x60;
          cf = true;
        } else {
          inc &= 0x0F;
          cf = false;
        }

        if ( emu.hf || ( emu.a & 0x0F ) > 0x09 ) {
          inc |= 0x06;
        }

        if ( emu.nf ) {
          emu.a = alu_sub_8( emu.a, inc );
        } else {
          emu.a = alu_add_8( emu.a, inc );
        }

        emu.zf = emu.a == 0x00;
        emu.hf = false;
        emu.cf = cf;

        return;

      // CPL
      case ( op == 0x2F ):
        emu.cycles += 4;
        emu.a = ~emu.a;
        return;

      // LDI a, (hl)
      case ( op == 0x2A ):
        emu.cycles += 8;
        emu.a = emu.get_byte( emu.hl );
        emu.hl = ( emu.hl + 1 ) & 0xFFFF;
        return;

      // LDD (hl), a
      case ( op == 0x32 ):
        emu.cycles += 8;
        emu.set_byte( emu.hl, emu.a );
        emu.hl = ( emu.hl - 1 ) & 0xFFFF;
        return;

      // LDD a, (hl)
      case ( op == 0x3A ):
        emu.cycles += 8;
        emu.a = emu.get_byte( emu.hl );
        emu.hl = ( emu.hl - 1 ) & 0xFFFF;
        return;

      // SCF
      case ( op == 0x37 ):
        emu.cycles += 4;
        emu.nf = false;
        emu.hf = false;
        emu.cf = true;
        return;

      // CCF
      case ( op == 0x3F ):
        emu.cycles += 4;
        emu.nf = false;
        emu.hf = false;
        emu.cf = false;
        return;

      // HALT
      case ( op == 0x76 ):
        emu.cycles += 4;
        emu.pc += 1;
        emu.halted = true;
        return;

      // CALL nn
      case ( op == 0xCD ):
        emu.cycles += 12;
        emu.set_word( emu.sp, ( emu.pc + 2 ) & 0xFFFF );
        emu.sp = ( emu.sp - 2 ) & 0xFFFF;
        emu.pc = u16;
        return;

      // CB prefix
      case ( op == 0xCB ):
        op = emu.get_byte( emu.pc++ );
        x  = ( op & 0xC0 ) >> 6;
        y  = ( op & 0x38 ) >> 3;

        emu.cycles += z == 0x6 ? 16 : 8;

        switch ( op & 7 )
        {
          // rot[y] r[z]
          case 0x0:
            alu_rot_8( y, z );
            return;

          // BIT y, r[ z ]
          case 0x1:
            emu.zf = ( get_r( z ) & ( 1 << y ) ) != 0x00;
            emu.nf = false;
            emu.hf = true;
            return;

          // RST y, r[ z ]
          case 0x2:
            set_r( z, get_r( z ) & ( ~ ( 1 << y ) ) );
            return;

          // TEST y, r[ z ]
          case 0x3:
            set_r( z, get_r( z ) | ( 1 << y ) );
            return;
        }

        return;

      // LDH (n), a
      case ( op == 0xE0 ):
        emu.cycles += 12;
        emu.pc += 1;
        emu.set_byte( 0xFF00 + u8, emu.a );
        return;

      // LD (c), a
      case ( op == 0xE2 ):
        emu.cycles += 12;
        emu.set_byte( 0xFF00 + emu.c, emu.a );
        return;

      // ADD sp, n
      case ( op == 0xE8 ):
        emu.cycles += 16;
        emu.pc += 2;

        emu.sp = alu_add_16( emu.sp, s16 );
        emu.zf = false;
        emu.nf = false;
        return;

      // JP (hl)
      case ( op == 0xE9 ):
        emu.cycles += 4;
        emu.pc = emu.hl;
        return;

      // LD (nn), a
      case ( op == 0xEA ):
        emu.cycles += 16;
        emu.pc += 2;
        emu.set_byte( u16, emu.a );
        return;

      // JP nn
      case ( op == 0xC3 ):
        emu.cycles += 12;
        emu.pc = u16;
        return;

      // RET
      case ( op == 0xC9 ):
        emu.cycles += 8;
        emu.sp = ( emu.sp + 2 ) & 0xFFFF;
        emu.pc = emu.get_word( emu.sp );
        return;

      // RETI
      case ( op == 0xD9 ):
        emu.cycles += 8;
        console.log( "Not implemented: RETI" );
        return;

      // LDH a, (n)
      case ( op == 0xF0 ):
        emu.cycles += 12;
        emu.pc += 1;
        emu.a = emu.get_byte( 0xFF00 + u8 );
        return;

      // LD a, (c)
      case ( op == 0xF2 ):
        emu.cycles += 12;
        this.a = emu.get_byte( 0xFF00 + emu.c );
        return;

      // DI
      case ( op == 0xF3 ):
        emu.cycles += 4;
        console.log( "Not implemented: DI" );
        return;

      // LDHL sp, n
      case ( op == 0xF8 ):
        emu.cycles += 12;
        emu.pc += 1;

        emu.hl = alu_add_16( sp, s8 );
        emu.zf = false;
        emu.nf = false;
        return;

      // LD sp, hl
      case ( op == 0xF9 ):
        emu.cycles += 8;
        emu.sp = emu.hl;
        return;

      // EI
      case ( op == 0xFB ):
        emu.cycles += 4;
        console.log( "Not implemented: EI" );
        return;

      // LD a, (nn)
      case ( op == 0xFA ):
        emu.cycles += 16;
        emu.pc += 2;
        emu.a = emu.get_byte( u16 );
        return;

      // LD r[y], r[z]
      case ( ( op & 0xC0 ) == 0x40 ):
        emu.cycles += 4;
        if ( y == 0x6 || z == 0x6 ) {
          emu.cycles += 4;
        }

        set_r( y, get_r( z ) );
        return;

      // ALU[y] r[z]
      case ( ( op & 0xC0 ) == 0x80 ):
        emu.cyles += 4;
        if ( z == 0x06 ) {
          emu.cycles += 4;
        }

        alu_8( y, get_r( z ) );
        return;

      // INC r[p]
      case ( ( op & 0xC7 ) == 0x04 ):
        emu.cycles += y == 0x6 ? 12 : 4;
        set_r( y, ( get_r( y ) + 1 ) & 0xFF );
        return;

      // DEC r[p]
      case ( ( op & 0xC7 ) == 0x05 ):
        emu.cycles += y == 0x6 ? 12 : 4;
        set_r( y, ( get_r( y ) - 1 ) & 0xFF );
        return;

      // LD r[y], n
      case ( ( op & 0xC7 ) == 0x06 ):
        emu.cycles += 8;
        emu.pc += 1;
        if ( y == 0x6) {
          emu.cycles += 4;
        }

        set_r( y, u8 );
        return;

      // ALU[y] n
      case ( ( op & 0xC7 ) == 0xC6 ):
        emu.cyles += 4;
        emu.pc += 1;
        if ( z == 0x06 ) {
          emu.cycles += 4;
        }

        alu_8( y, u8 );
        return;

      // RST y * 8
      case ( ( op & 0xC7 ) == 0xC7 ):
        emu.cycles += 32;
        emu.set_word( emu.sp, emu.pc );
        emu.sp = ( emu.sp + 2 ) & 0xFFFF;
        emu.pc = y << 3;
        return;

      // LD rp[p], nn
      case ( ( op & 0xCF) == 0x01 ):
        emu.cycles += 12;
        emu.pc += 2;
        set_rp( p, u16 );
        return;

      // INC rp[p]
      case ( ( op & 0xCF ) == 0x03 ):
        emu.cycles += 8;
        set_rp( p, ( get_rp( p ) + 1 ) & 0xFFFF );
        return;

      // DEC rp[p]
      case ( (op & 0xCF ) == 0x0B ):
        emu.cycles += 8;
        set_rp( p, ( get_rp( p ) - 1 ) & 0xFFFF );
        return;

      // ADD hl, rp[p]
      case ( ( op & 0xCF ) == 0x09 ):
        emu.cycles += 8;
        emu.hl = alu_add_16( emu.hl, get_rp( p ) );
        return;

      // POP nn
      case ( ( op & 0xCF ) == 0xC1 ):
        emu.cycles += 12;
        emu.sp = ( emu.sp + 2 ) & 0xFFFF;

        switch ( p ) {
          case 0x0: emu.bc = emu.get_word( emu.sp ); break;
          case 0x1: emu.de = emu.get_word( emu.sp ); break;
          case 0x2: emu.hl = emu.get_word( emu.sp ); break;
          case 0x3: emu.af = emu.get_word( emu.sp ); break;
        }

        return;

      // PUSH nn
      case ( ( op & 0xCF ) == 0xC5 ):
        emu.cycles += 16;
        switch ( p ) {
          case 0x0: emu.set_word( emu.sp, emu.bc ); break;
          case 0x1: emu.set_word( emu.sp, emu.de ); break;
          case 0x2: emu.set_word( emu.sp, emu.hl ); break;
          case 0x3: emu.set_word( emu.sp, emu.af ); break;
        }

        emu.sp = ( emu.sp - 2 ) & 0xFFFF;
        return;

      // JR cc, n
      case ( ( op & 0xE7 ) == 0x20 ):
        emu.cycles += 8;

        if ( check_cond( y - 4 ) ) {
          emu.cycles += 4;
          emu.pc = ( emu.pc + s8 - 1 ) & 0xFFFF;
        }

        return;

      // RET cc
      case ( ( op & 0xE7 ) == 0xC0 ):
        emu.cycles += 8;

        if ( check_cond( y ) ) {
          emu.cycles += 12;
          emu.sp = ( emu.sp + 2 ) & 0xFFFF;
          emu.pc = emu.get_word( emu.sp );
        }

        return;

      // JP cc, nn
      case ( ( op & 0xE7 ) == 0xC2 ):
        emu.cycles += 12;
        emu.pc += 2;

        if ( check_cond( y ) ) {
          emu.cycles += 4;
          emu.pc = u16;
        }
        return;

      // CALL cc[y], nn
      case ( ( op & 0xE7 ) == 0xC4 ):
        emu.cycles += 12;
        emu.pc += 2;

        if ( check_cond( y ) ) {
          emu.cycles += 12;
          emu.pc = u16;
        }
        return;

      default:
        throw "Invalid opcode: 0x" + op.toString( 16 );
    }
  }

  /**
    * Executes a single CPU operation
    */
  emu.tick = function( )
  {
    if ( !emu.halted )
    {
      instr( emu.get_byte( emu.pc++ ) );
    }
  }
} ) ( window.emu = window.emu || { } );
