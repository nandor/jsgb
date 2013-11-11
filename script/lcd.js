/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( )
{
  emu.lcd_enable      = false;
  emu.lcd_wnd_tilemap = 0x9800;
  emu.lcd_wnd_display = false;
  emu.lcd_tile_data   = 0x8800;
  emu.lcd_bg_tilemap  = 0x9800;
  emu.lcd_obj_size    = 0x08;
  emu.lcd_obj_display = false;
  emu.lcd_bg_display  = false;
  emu.lcd_scx         = 0x00;
  emu.lcd_scy         = 0x00;
  emu.lcd_wy          = 0x00;
  emu.lcd_wx          = 0x00;
  emu.lcd_lx          = 0x00;
  emu.lcd_ly          = 0x00;
  emu.lcd_bg          = [ 0x0, 0x0, 0x0, 0x0 ];
  emu.vram            = new Uint8Array( 160 * 144 * 4 );

  emu.build_vram = function( )
  {
    if ( !emu.lcd_enable )
    {
      for ( var i = 0; i < emu.vram.length; ++i )
      {
        emu.vram[ i ] = ( i & 3 ) == 3 ? 0xFF : 0x00;
      }
    }

    if ( emu.lcd_bg_display )
    {
      var base = emu.lcd_bg_tilemap, vidx = -4;
      var y, x, l, c, tile, b0, b1, idx;

      for ( var yy = emu.lcd_scy; yy < emu.lcd_scy + 144; yy++ )
      {
        y = yy & 0xFF;
        l = y & 7;

        for ( var xx = emu.lcd_scx; xx < emu.lcd_scx + 160; xx++ )
        {
          x = xx & 0xFF;
          vidx += 4;

          tile = emu.ram[ base + ( y >> 3 ) * 32 + ( x >> 3 ) ];
          if ( emu.lcd_tile_data == 0x8800 && ( tile & 0x80 ) ) {
            tile |= ~0xFF;
          }

          c = 7 - ( x & 7 );

          idx = emu.lcd_tile_data | ( tile << 4 ) | ( l << 1 );
          b0 = emu.ram[ idx ];
          b1 = emu.ram[ idx + 1];

          pix = 0x00;
          pix |= ( ( b0 & ( 1 << c ) ) >> c ) << 0;
          pix |= ( ( b1 & ( 1 << c ) ) >> c ) << 1;

          switch ( emu.lcd_bg[ pix ] ) {
            case 0x0:
              emu.vram[ vidx + 0 ] = 0xFF;
              emu.vram[ vidx + 1 ] = 0xFF;
              emu.vram[ vidx + 2 ] = 0xFF;
              emu.vram[ vidx + 3 ] = 0xFF;
              break;
            case 0x1:
              emu.vram[ vidx + 0 ] = 0xAA;
              emu.vram[ vidx + 1 ] = 0xAA;
              emu.vram[ vidx + 2 ] = 0xAA;
              emu.vram[ vidx + 3 ] = 0xFF;
              break;
            case 0x2:
              emu.vram[ vidx + 0 ] = 0x66;
              emu.vram[ vidx + 1 ] = 0x66;
              emu.vram[ vidx + 2 ] = 0x66;
              emu.vram[ vidx + 3 ] = 0xFF;
              break;
            case 0x3:
              emu.vram[ vidx + 0 ] = 0x00;
              emu.vram[ vidx + 1 ] = 0x00;
              emu.vram[ vidx + 2 ] = 0x00;
              emu.vram[ vidx + 3 ] = 0xFF;
              break;
          }
        }
      }
    }
  }
} ) ( this.emu = this.emu || { } );