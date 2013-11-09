// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.

( function ( emu )
{
	function load_rom( rom_name )
	{
		var req;

    req = new XMLHttpRequest( );
		req.open( "GET", rom_name, true );
		req.responseType = "arraybuffer";

    req.onload = function( evt )
    {
      rom = new ROM( req.response );
      emu.load_rom( rom );

      for (var i = 0; i < 100; ++i)
      {
        emu.tick( );
        $("#pc").text(emu.pc.toString( 16 ));
        $("#sp").text(emu.sp.toString( 16 ));
        $("#af").text(emu.af.toString( 16 ));
        $("#bc").text(emu.bc.toString( 16 ));
        $("#de").text(emu.de.toString( 16 ));
        $("#hl").text(emu.hl.toString( 16 ));
        $("#zf").text(emu.zf ? 1 : 0);
        $("#nf").text(emu.nf ? 1 : 0);
        $("#hf").text(emu.hf ? 1 : 0);
        $("#cf").text(emu.cf ? 1 : 0);
      }

      $("#step").click( function( )
      {
        emu.tick( );

        $("#pc").text(emu.pc.toString( 16 ));
        $("#sp").text(emu.sp.toString( 16 ));
        $("#af").text(emu.af.toString( 16 ));
        $("#bc").text(emu.bc.toString( 16 ));
        $("#de").text(emu.de.toString( 16 ));
        $("#hl").text(emu.hl.toString( 16 ));
        $("#zf").text(emu.zf ? 1 : 0);
        $("#nf").text(emu.nf ? 1 : 0);
        $("#hf").text(emu.hf ? 1 : 0);
        $("#cf").text(emu.cf ? 1 : 0);
      });
    }

    req.send( );
	}

  emu.init = function( )
  {
    for ( var i = 0; i < 1000; ++i )
    {
      emu.tick( );
    }
  }
}) ( window.emu = window.emu || { } );