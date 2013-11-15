/**
 * This file is part of the JavaScript GameBoy Emulator
 * Licensing information can be found in the LICENSE file
 * (C) 2013 Licker Nandor. All rights reserved.
 */

( function( )
{
  emu.lcd_enable       = false;
  emu.lcd_wnd_tilemap  = 0x9800;
  emu.lcd_wnd_display  = false;
  emu.lcd_tile_data    = 0x8800;
  emu.lcd_bg_tilemap   = 0x9800;
  emu.lcd_obj_size     = 0x08;
  emu.lcd_obj_display  = false;
  emu.lcd_bg_display   = false;
  emu.lcd_scx          = 0x00;
  emu.lcd_scy          = 0x00;
  emu.lcd_wy           = 0x00;
  emu.lcd_wx           = 0x00;
  emu.lcd_lx           = 0x00;
  emu.lcd_ly           = 0x00;
  emu.lcd_bg           = [ 0x0, 0x0, 0x0, 0x0 ];
  emu.lcd_obp0         = [ 0x0, 0x0, 0x0, 0x0 ];
  emu.lcd_obp1         = [ 0x0, 0x0, 0x0, 0x0 ];
  emu.lcd_vblank       = false;
  emu.vram             = new Uint8Array( 160 * 144 * 4 );


  /**
   * Returns a pixel from a tile in the tile data
   * table
   */
  function get_tile_pixel( tile, l, c )
  {
    var b0, b1, idx, pix;

    idx = emu.lcd_tile_data | ( tile << 4 ) | ( l << 1 );
    b0 = emu.ram[ idx ];
    b1 = emu.ram[ idx + 1];

    pix = 0x00;
    pix |= ( ( b0 & ( 1 << c ) ) >> c ) << 0;
    pix |= ( ( b1 & ( 1 << c ) ) >> c ) << 1;

    switch ( emu.lcd_bg[ pix ] )
    {
      case 0x0: return 0xFF;
      case 0x1: return 0xAA;
      case 0x2: return 0x66;
      case 0x3: return 0x00;
    }
  }

  function build_background( vidx, y, x )
  {
    var tile, pix;

    tile = emu.ram[ emu.lcd_bg_tilemap + ( y >> 3 ) * 32 + ( x >> 3 ) ];
    if ( emu.lcd_tile_data == 0x8800 && ( tile & 0x80 ) ) {
      tile |= ~0xFF;
    }

    pix = get_tile_pixel( tile, y & 7, 7 - ( x & 7 ) );

    emu.vram[ vidx + 0 ] = pix;
    emu.vram[ vidx + 1 ] = pix;
    emu.vram[ vidx + 2 ] = pix;
    emu.vram[ vidx + 3 ] = 0xFF;
  }

  function build_window( vidx, y, x )
  {
    var tile, pix;

    tile = emu.ram[ emu.lcd_wnd_tilemap + ( y >> 3 ) * 32 + ( x >> 3 ) ];
    if ( emu.lcd_tile_data == 0x8800 && ( tile & 0x80 ) ) {
      tile |= ~0xFF;
    }

    pix = get_tile_pixel( tile, y & 7, 7 - ( x & 7 ) );

    emu.vram[ vidx + 0 ] = pix;
    emu.vram[ vidx + 1 ] = pix;
    emu.vram[ vidx + 2 ] = pix;
    emu.vram[ vidx + 3 ] = 0xFF;
  }

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
      var vidx = -4;
      for ( var y = emu.lcd_scy; y < emu.lcd_scy + 144; ++y )
      {
        for ( var x = emu.lcd_scx; x < emu.lcd_scx + 160; ++x )
        {
          build_background( vidx += 4, y & 0xFF, x & 0xFF );
        }
      }

      if ( emu.lcd_wnd_display )
      {
        var xx, yy;
        for ( var y = emu.lcd_wy; y < 144; ++y )
        {
          for ( var x = Math.max( 0, emu.lcd_wx - 7 ); x < 160; ++ x )
          {
            xx = x - emu.lcd_wx + 7;
            yy = y - emu.lcd_wy;
            build_window( ( y * 160 + x ) << 2, yy, xx );
          }
        }
      }
    }

    if ( emu.lcd_obj_display )
    {
      var x0, y0, xx, yy, p, f, vidx;

      for ( var i = 0; i < 40; ++i )
      {
        x0 = emu.ram[ 0xFE00 + ( i << 2 ) + 0 ];
        y0 = emu.ram[ 0xFE00 + ( i << 2 ) + 0 ];
        p = emu.ram[ 0xFE00 + ( i << 2 ) + 0 ];
        f = emu.ram[ 0xFE00 + ( i << 2 ) + 0 ];

        for ( var y = y0; y < Math.min( y0 + 8, 144 ); ++y )
        {
          for (var x = x0; x < Math.min( x0 + 8, 160 ); ++x )
          {
            xx = x - x0;
            yy = y - y0;
            vidx = ( y * 160 + x ) << 2;

            pix = get_tile_pixel( p, yy & 7, 7 - ( xx & 7 ) );

            emu.vram[ vidx + 0 ] = pix;
            emu.vram[ vidx + 1 ] = pix;
            emu.vram[ vidx + 2 ] = pix;
            emu.vram[ vidx + 3 ] = 0xFF;
          }
        }
      }
    }
  }

  emu.debug_build_vram = function( )
  {
    var idx, pix;

    for ( var y = 0; y < 0x10; ++y )
    {
      for ( var x = 0; x < 0x10; ++x )
      {
        for ( var i = 0; i < 8; ++i )
        {
          for ( var j = 0; j < 8; ++j )
          {
            idx = ( ( ( y << 3 ) + i ) * 160 + ( x << 3 ) + j ) << 2;
            pix = get_tile_pixel( ( y << 4 ) | x, i, 7 - j );

            emu.vram[ idx + 0 ] = pix;
            emu.vram[ idx + 1 ] = pix;
            emu.vram[ idx + 2 ] = pix;
            emu.vram[ idx + 3 ] = 0xFF;
          }
        }
      }
    }
  }
} ) ( this.emu = this.emu || { } );