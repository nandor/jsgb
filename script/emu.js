// This file is part of the JavaScript GameBoy Emulator
// Licensing information can be found in the LICENSE file
// (C) 2013 Licker Nandor. All rights reserved.

(function ()
{
  var ram, cpu, gpu, rom;

	function load_rom( rom_name )
	{
		var req;

    req = new XMLHttpRequest( );
		req.open( "GET", rom_name, true );
		req.responseType = "arraybuffer";

    req.onload = function( evt )
    {
      rom = new ROM( req.response );
      ram.load_rom( rom );
      for (var i = 0; i < 100; ++i) {
        cpu.tick( );
        $("#pc").text(cpu.pc.toString( 16 ));
        $("#sp").text(cpu.sp.toString( 16 ));
        $("#af").text(cpu.af.toString( 16 ));
        $("#bc").text(cpu.bc.toString( 16 ));
        $("#de").text(cpu.de.toString( 16 ));
        $("#hl").text(cpu.hl.toString( 16 ));
        $("#zf").text(cpu.zf ? 1 : 0);
        $("#nf").text(cpu.nf ? 1 : 0);
        $("#hf").text(cpu.hf ? 1 : 0);
        $("#cf").text(cpu.cf ? 1 : 0);
      }

      $("#step").click( function( ) {
        cpu.tick( );

        $("#pc").text(cpu.pc.toString( 16 ));
        $("#sp").text(cpu.sp.toString( 16 ));
        $("#af").text(cpu.af.toString( 16 ));
        $("#bc").text(cpu.bc.toString( 16 ));
        $("#de").text(cpu.de.toString( 16 ));
        $("#hl").text(cpu.hl.toString( 16 ));
        $("#zf").text(cpu.zf ? 1 : 0);
        $("#nf").text(cpu.nf ? 1 : 0);
        $("#hf").text(cpu.hf ? 1 : 0);
        $("#cf").text(cpu.cf ? 1 : 0);
      });
    }

    req.send( );
	}

  function init( )
  {
    ram = new RAM( );
    gpu = new GPU( ram );
    cpu = new CPU( ram );
    load_rom( "pokemon_crystal.gbc" );
  }

  init( );
}) ();