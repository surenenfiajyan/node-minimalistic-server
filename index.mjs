import * as http from 'node:http';
import * as querystring from "node:querystring";
import * as fs from "node:fs/promises";

const servers = new Map();
const keepAliveTimeout = 20000;

const mimeTypes = {
	"x3d": "application/vnd.hzn-3d-crossword",
	"3gp": "video/3gpp",
	"3g2": "video/3gpp2",
	"mseq": "application/vnd.mseq",
	"pwn": "application/vnd.3m.post-it-notes",
	"plb": "application/vnd.3gpp.pic-bw-large",
	"psb": "application/vnd.3gpp.pic-bw-small",
	"pvb": "application/vnd.3gpp.pic-bw-var",
	"tcap": "application/vnd.3gpp2.tcap",
	"7z": "application/x-7z-compressed",
	"abw": "application/x-abiword",
	"ace": "application/x-ace-compressed",
	"acc": "application/vnd.americandynamics.acc",
	"acu": "application/vnd.acucobol",
	"atc": "application/vnd.acucorp",
	"adp": "audio/adpcm",
	"aab": "application/x-authorware-bin",
	"aam": "application/x-authorware-map",
	"aas": "application/x-authorware-seg",
	"air": "application/vnd.adobe.air-application-installer-package+zip",
	"swf": "application/x-shockwave-flash",
	"fxp": "application/vnd.adobe.fxp",
	"pdf": "application/pdf",
	"ppd": "application/vnd.cups-ppd",
	"dir": "application/x-director",
	"xdp": "application/vnd.adobe.xdp+xml",
	"xfdf": "application/vnd.adobe.xfdf",
	"aac": "audio/x-aac",
	"ahead": "application/vnd.ahead.space",
	"azf": "application/vnd.airzip.filesecure.azf",
	"azs": "application/vnd.airzip.filesecure.azs",
	"azw": "application/vnd.amazon.ebook",
	"ami": "application/vnd.amiga.ami",
	"N/A": "application/andrew-inset",
	"apk": "application/vnd.android.package-archive",
	"cii": "application/vnd.anser-web-certificate-issue-initiation",
	"fti": "application/vnd.anser-web-funds-transfer-initiation",
	"atx": "application/vnd.antix.game-component",
	"dmg": "application/x-apple-diskimage",
	"mpkg": "application/vnd.apple.installer+xml",
	"aw": "application/applixware",
	"les": "application/vnd.hhe.lesson-player",
	"swi": "application/vnd.aristanetworks.swi",
	"s": "text/x-asm",
	"atomcat": "application/atomcat+xml",
	"atomsvc": "application/atomsvc+xml",
	"ac": "application/pkix-attr-cert",
	"aif": "audio/x-aiff",
	"avi": "video/x-msvideo",
	"aep": "application/vnd.audiograph",
	"dxf": "image/vnd.dxf",
	"dwf": "model/vnd.dwf",
	"par": "text/plain-bas",
	"bcpio": "application/x-bcpio",
	"bin": "application/octet-stream",
	"bmp": "image/bmp",
	"torrent": "application/x-bittorrent",
	"cod": "application/vnd.rim.cod",
	"mpm": "application/vnd.blueice.multipass",
	"bmi": "application/vnd.bmi",
	"sh": "application/x-sh",
	"btif": "image/prs.btif",
	"rep": "application/vnd.businessobjects",
	"bz": "application/x-bzip",
	"bz2": "application/x-bzip2",
	"csh": "application/x-csh",
	"c": "text/x-c",
	"cdxml": "application/vnd.chemdraw+xml",
	"css": "text/css",
	"cdx": "chemical/x-cdx",
	"cml": "chemical/x-cml",
	"csml": "chemical/x-csml",
	"cdbcmsg": "application/vnd.contact.cmsg",
	"cla": "application/vnd.claymore",
	"c4g": "application/vnd.clonk.c4group",
	"sub": "image/vnd.dvb.subtitle",
	"cdmia": "application/cdmi-capability",
	"cdmic": "application/cdmi-container",
	"cdmid": "application/cdmi-domain",
	"cdmio": "application/cdmi-object",
	"cdmiq": "application/cdmi-queue",
	"c11amc": "application/vnd.cluetrust.cartomobile-config",
	"c11amz": "application/vnd.cluetrust.cartomobile-config-pkg",
	"ras": "image/x-cmu-raster",
	"dae": "model/vnd.collada+xml",
	"csv": "text/csv",
	"cpt": "application/mac-compactpro",
	"wmlc": "application/vnd.wap.wmlc",
	"cgm": "image/cgm",
	"ice": "x-conference/x-cooltalk",
	"cmx": "image/x-cmx",
	"xar": "application/vnd.xara",
	"cmc": "application/vnd.cosmocaller",
	"cpio": "application/x-cpio",
	"clkx": "application/vnd.crick.clicker",
	"clkk": "application/vnd.crick.clicker.keyboard",
	"clkp": "application/vnd.crick.clicker.palette",
	"clkt": "application/vnd.crick.clicker.template",
	"clkw": "application/vnd.crick.clicker.wordbank",
	"wbs": "application/vnd.criticaltools.wbs+xml",
	"cryptonote": "application/vnd.rig.cryptonote",
	"cif": "chemical/x-cif",
	"cmdf": "chemical/x-cmdf",
	"cu": "application/cu-seeme",
	"cww": "application/prs.cww",
	"curl": "text/vnd.curl",
	"dcurl": "text/vnd.curl.dcurl",
	"mcurl": "text/vnd.curl.mcurl",
	"scurl": "text/vnd.curl.scurl",
	"car": "application/vnd.curl.car",
	"pcurl": "application/vnd.curl.pcurl",
	"cmp": "application/vnd.yellowriver-custom-menu",
	"dssc": "application/dssc+der",
	"xdssc": "application/dssc+xml",
	"deb": "application/x-debian-package",
	"uva": "audio/vnd.dece.audio",
	"uvi": "image/vnd.dece.graphic",
	"uvh": "video/vnd.dece.hd",
	"uvm": "video/vnd.dece.mobile",
	"uvu": "video/vnd.uvvu.mp4",
	"uvp": "video/vnd.dece.pd",
	"uvs": "video/vnd.dece.sd",
	"uvv": "video/vnd.dece.video",
	"dvi": "application/x-dvi",
	"seed": "application/vnd.fdsn.seed",
	"dtb": "application/x-dtbook+xml",
	"res": "application/x-dtbresource+xml",
	"ait": "application/vnd.dvb.ait",
	"svc": "application/vnd.dvb.service",
	"eol": "audio/vnd.digital-winds",
	"djvu": "image/vnd.djvu",
	"dtd": "application/xml-dtd",
	"mlp": "application/vnd.dolby.mlp",
	"wad": "application/x-doom",
	"dpg": "application/vnd.dpgraph",
	"dra": "audio/vnd.dra",
	"dfac": "application/vnd.dreamfactory",
	"dts": "audio/vnd.dts",
	"dtshd": "audio/vnd.dts.hd",
	"dwg": "image/vnd.dwg",
	"geo": "application/vnd.dynageo",
	"es": "application/ecmascript",
	"mag": "application/vnd.ecowin.chart",
	"mmr": "image/vnd.fujixerox.edmics-mmr",
	"rlc": "image/vnd.fujixerox.edmics-rlc",
	"exi": "application/exi",
	"mgz": "application/vnd.proteus.magazine",
	"epub": "application/epub+zip",
	"eml": "message/rfc822",
	"nml": "application/vnd.enliven",
	"xpr": "application/vnd.is-xpr",
	"xif": "image/vnd.xiff",
	"xfdl": "application/vnd.xfdl",
	"emma": "application/emma+xml",
	"ez2": "application/vnd.ezpix-album",
	"ez3": "application/vnd.ezpix-package",
	"fst": "image/vnd.fst",
	"fvt": "video/vnd.fvt",
	"fbs": "image/vnd.fastbidsheet",
	"fe_launch": "application/vnd.denovo.fcselayout-link",
	"f4v": "video/x-f4v",
	"flv": "video/x-flv",
	"fpx": "image/vnd.fpx",
	"npx": "image/vnd.net-fpx",
	"flx": "text/vnd.fmi.flexstor",
	"fli": "video/x-fli",
	"ftc": "application/vnd.fluxtime.clip",
	"fdf": "application/vnd.fdf",
	"f": "text/x-fortran",
	"mif": "application/vnd.mif",
	"fm": "application/vnd.framemaker",
	"fh": "image/x-freehand",
	"fsc": "application/vnd.fsc.weblaunch",
	"fnc": "application/vnd.frogans.fnc",
	"ltf": "application/vnd.frogans.ltf",
	"ddd": "application/vnd.fujixerox.ddd",
	"xdw": "application/vnd.fujixerox.docuworks",
	"xbd": "application/vnd.fujixerox.docuworks.binder",
	"oas": "application/vnd.fujitsu.oasys",
	"oa2": "application/vnd.fujitsu.oasys2",
	"oa3": "application/vnd.fujitsu.oasys3",
	"fg5": "application/vnd.fujitsu.oasysgp",
	"bh2": "application/vnd.fujitsu.oasysprs",
	"spl": "application/x-futuresplash",
	"fzs": "application/vnd.fuzzysheet",
	"g3": "image/g3fax",
	"gmx": "application/vnd.gmx",
	"gtw": "model/vnd.gtw",
	"txd": "application/vnd.genomatix.tuxedo",
	"ggb": "application/vnd.geogebra.file",
	"ggt": "application/vnd.geogebra.tool",
	"gdl": "model/vnd.gdl",
	"gex": "application/vnd.geometry-explorer",
	"gxt": "application/vnd.geonext",
	"g2w": "application/vnd.geoplan",
	"g3w": "application/vnd.geospace",
	"gsf": "application/x-font-ghostscript",
	"bdf": "application/x-font-bdf",
	"gtar": "application/x-gtar",
	"texinfo": "application/x-texinfo",
	"gnumeric": "application/x-gnumeric",
	"kml": "application/vnd.google-earth.kml+xml",
	"kmz": "application/vnd.google-earth.kmz",
	"gqf": "application/vnd.grafeq",
	"gif": "image/gif",
	"gv": "text/vnd.graphviz",
	"gac": "application/vnd.groove-account",
	"ghf": "application/vnd.groove-help",
	"gim": "application/vnd.groove-identity-message",
	"grv": "application/vnd.groove-injector",
	"gtm": "application/vnd.groove-tool-message",
	"tpl": "application/vnd.groove-tool-template",
	"vcg": "application/vnd.groove-vcard",
	"h261": "video/h261",
	"h263": "video/h263",
	"h264": "video/h264",
	"hpid": "application/vnd.hp-hpid",
	"hps": "application/vnd.hp-hps",
	"hdf": "application/x-hdf",
	"rip": "audio/vnd.rip",
	"hbci": "application/vnd.hbci",
	"jlt": "application/vnd.hp-jlyt",
	"pcl": "application/vnd.hp-pcl",
	"hpgl": "application/vnd.hp-hpgl",
	"hvs": "application/vnd.yamaha.hv-script",
	"hvd": "application/vnd.yamaha.hv-dic",
	"hvp": "application/vnd.yamaha.hv-voice",
	"sfd-hdstx": "application/vnd.hydrostatix.sof-data",
	"stk": "application/hyperstudio",
	"hal": "application/vnd.hal+xml",
	"html": "text/html",
	"irm": "application/vnd.ibm.rights-management",
	"sc": "application/vnd.ibm.secure-container",
	"ics": "text/calendar",
	"icc": "application/vnd.iccprofile",
	"ico": "image/x-icon",
	"igl": "application/vnd.igloader",
	"ief": "image/ief",
	"ivp": "application/vnd.immervision-ivp",
	"ivu": "application/vnd.immervision-ivu",
	"rif": "application/reginfo+xml",
	"3dml": "text/vnd.in3d.3dml",
	"spot": "text/vnd.in3d.spot",
	"igs": "model/iges",
	"i2g": "application/vnd.intergeo",
	"cdy": "application/vnd.cinderella",
	"xpw": "application/vnd.intercon.formnet",
	"fcs": "application/vnd.isac.fcs",
	"ipfix": "application/ipfix",
	"cer": "application/pkix-cert",
	"pki": "application/pkixcmp",
	"crl": "application/pkix-crl",
	"pkipath": "application/pkix-pkipath",
	"igm": "application/vnd.insors.igm",
	"rcprofile": "application/vnd.ipunplugged.rcprofile",
	"irp": "application/vnd.irepository.package+xml",
	"jad": "text/vnd.sun.j2me.app-descriptor",
	"jar": "application/java-archive",
	"class": "application/java-vm",
	"jnlp": "application/x-java-jnlp-file",
	"ser": "application/java-serialized-object",
	"java": "text/x-java-source,java",
	"js": "application/javascript",
	"mjs": "application/javascript",
	"json": "application/json",
	"joda": "application/vnd.joost.joda-archive",
	"jpm": "video/jpm",
	"pjpeg": "image/pjpeg",
	"jpgv": "video/jpeg",
	"ktz": "application/vnd.kahootz",
	"mmd": "application/vnd.chipnuts.karaoke-mmd",
	"karbon": "application/vnd.kde.karbon",
	"chrt": "application/vnd.kde.kchart",
	"kfo": "application/vnd.kde.kformula",
	"flw": "application/vnd.kde.kivio",
	"kon": "application/vnd.kde.kontour",
	"kpr": "application/vnd.kde.kpresenter",
	"ksp": "application/vnd.kde.kspread",
	"kwd": "application/vnd.kde.kword",
	"htke": "application/vnd.kenameaapp",
	"kia": "application/vnd.kidspiration",
	"kne": "application/vnd.kinar",
	"sse": "application/vnd.kodak-descriptor",
	"lasxml": "application/vnd.las.las+xml",
	"latex": "application/x-latex",
	"lbd": "application/vnd.llamagraphics.life-balance.desktop",
	"lbe": "application/vnd.llamagraphics.life-balance.exchange+xml",
	"jam": "application/vnd.jam",
	"123": "application/vnd.lotus-1-2-3",
	"apr": "application/vnd.lotus-approach",
	"pre": "application/vnd.lotus-freelance",
	"nsf": "application/vnd.lotus-notes",
	"org": "application/vnd.lotus-organizer",
	"scm": "application/vnd.lotus-screencam",
	"lwp": "application/vnd.lotus-wordpro",
	"lvp": "audio/vnd.lucent.voice",
	"m3u": "audio/x-mpegurl",
	"m4v": "video/x-m4v",
	"hqx": "application/mac-binhex40",
	"portpkg": "application/vnd.macports.portpkg",
	"mgp": "application/vnd.osgeo.mapguide.package",
	"mrc": "application/marc",
	"mrcx": "application/marcxml+xml",
	"mxf": "application/mxf",
	"nbp": "application/vnd.wolfram.player",
	"ma": "application/mathematica",
	"mathml": "application/mathml+xml",
	"mbox": "application/mbox",
	"mc1": "application/vnd.medcalcdata",
	"mscml": "application/mediaservercontrol+xml",
	"cdkey": "application/vnd.mediastation.cdkey",
	"mwf": "application/vnd.mfer",
	"mfm": "application/vnd.mfmp",
	"msh": "model/mesh",
	"mads": "application/mads+xml",
	"mets": "application/mets+xml",
	"mods": "application/mods+xml",
	"meta4": "application/metalink4+xml",
	"mcd": "application/vnd.mcd",
	"flo": "application/vnd.micrografx.flo",
	"igx": "application/vnd.micrografx.igx",
	"es3": "application/vnd.eszigno3+xml",
	"mdb": "application/x-msaccess",
	"asf": "video/x-ms-asf",
	"exe": "application/x-msdownload",
	"cil": "application/vnd.ms-artgalry",
	"cab": "application/vnd.ms-cab-compressed",
	"ims": "application/vnd.ms-ims",
	"application": "application/x-ms-application",
	"clp": "application/x-msclip",
	"mdi": "image/vnd.ms-modi",
	"eot": "application/vnd.ms-fontobject",
	"xls": "application/vnd.ms-excel",
	"xlam": "application/vnd.ms-excel.addin.macroenabled.12",
	"xlsb": "application/vnd.ms-excel.sheet.binary.macroenabled.12",
	"xltm": "application/vnd.ms-excel.template.macroenabled.12",
	"xlsm": "application/vnd.ms-excel.sheet.macroenabled.12",
	"chm": "application/vnd.ms-htmlhelp",
	"crd": "application/x-mscardfile",
	"lrm": "application/vnd.ms-lrm",
	"mvb": "application/x-msmediaview",
	"mny": "application/x-msmoney",
	"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"sldx": "application/vnd.openxmlformats-officedocument.presentationml.slide",
	"ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
	"potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
	"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
	"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
	"obd": "application/x-msbinder",
	"thmx": "application/vnd.ms-officetheme",
	"onetoc": "application/onenote",
	"pya": "audio/vnd.ms-playready.media.pya",
	"pyv": "video/vnd.ms-playready.media.pyv",
	"ppt": "application/vnd.ms-powerpoint",
	"ppam": "application/vnd.ms-powerpoint.addin.macroenabled.12",
	"sldm": "application/vnd.ms-powerpoint.slide.macroenabled.12",
	"pptm": "application/vnd.ms-powerpoint.presentation.macroenabled.12",
	"ppsm": "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
	"potm": "application/vnd.ms-powerpoint.template.macroenabled.12",
	"mpp": "application/vnd.ms-project",
	"pub": "application/x-mspublisher",
	"scd": "application/x-msschedule",
	"xap": "application/x-silverlight-app",
	"stl": "application/vnd.ms-pki.stl",
	"cat": "application/vnd.ms-pki.seccat",
	"vsd": "application/vnd.visio",
	"vsdx": "application/vnd.visio2013",
	"wm": "video/x-ms-wm",
	"wma": "audio/x-ms-wma",
	"wax": "audio/x-ms-wax",
	"wmx": "video/x-ms-wmx",
	"wmd": "application/x-ms-wmd",
	"wpl": "application/vnd.ms-wpl",
	"wmz": "application/x-ms-wmz",
	"wmv": "video/x-ms-wmv",
	"wvx": "video/x-ms-wvx",
	"wmf": "application/x-msmetafile",
	"trm": "application/x-msterminal",
	"doc": "application/msword",
	"docm": "application/vnd.ms-word.document.macroenabled.12",
	"dotm": "application/vnd.ms-word.template.macroenabled.12",
	"wri": "application/x-mswrite",
	"wps": "application/vnd.ms-works",
	"xbap": "application/x-ms-xbap",
	"xps": "application/vnd.ms-xpsdocument",
	"mid": "audio/midi",
	"mpy": "application/vnd.ibm.minipay",
	"afp": "application/vnd.ibm.modcap",
	"rms": "application/vnd.jcp.javame.midlet-rms",
	"tmo": "application/vnd.tmobile-livetv",
	"prc": "application/x-mobipocket-ebook",
	"mbk": "application/vnd.mobius.mbk",
	"dis": "application/vnd.mobius.dis",
	"plc": "application/vnd.mobius.plc",
	"mqy": "application/vnd.mobius.mqy",
	"msl": "application/vnd.mobius.msl",
	"txf": "application/vnd.mobius.txf",
	"daf": "application/vnd.mobius.daf",
	"fly": "text/vnd.fly",
	"mpc": "application/vnd.mophun.certificate",
	"mpn": "application/vnd.mophun.application",
	"mj2": "video/mj2",
	"mpga": "audio/mpeg",
	"mxu": "video/vnd.mpegurl",
	"mpeg": "video/mpeg",
	"m21": "application/mp21",
	"mp4a": "audio/mp4",
	"mp4": "application/mp4",
	"m3u8": "application/vnd.apple.mpegurl",
	"mus": "application/vnd.musician",
	"msty": "application/vnd.muvee.style",
	"mxml": "application/xv+xml",
	"ngdat": "application/vnd.nokia.n-gage.data",
	"n-gage": "application/vnd.nokia.n-gage.symbian.install",
	"ncx": "application/x-dtbncx+xml",
	"nc": "application/x-netcdf",
	"nlu": "application/vnd.neurolanguage.nlu",
	"dna": "application/vnd.dna",
	"nnd": "application/vnd.noblenet-directory",
	"nns": "application/vnd.noblenet-sealer",
	"nnw": "application/vnd.noblenet-web",
	"rpst": "application/vnd.nokia.radio-preset",
	"rpss": "application/vnd.nokia.radio-presets",
	"n3": "text/n3",
	"edm": "application/vnd.novadigm.edm",
	"edx": "application/vnd.novadigm.edx",
	"ext": "application/vnd.novadigm.ext",
	"gph": "application/vnd.flographit",
	"ecelp4800": "audio/vnd.nuera.ecelp4800",
	"ecelp7470": "audio/vnd.nuera.ecelp7470",
	"ecelp9600": "audio/vnd.nuera.ecelp9600",
	"oda": "application/oda",
	"ogx": "application/ogg",
	"oga": "audio/ogg",
	"ogv": "video/ogg",
	"dd2": "application/vnd.oma.dd2+xml",
	"oth": "application/vnd.oasis.opendocument.text-web",
	"opf": "application/oebps-package+xml",
	"qbo": "application/vnd.intu.qbo",
	"oxt": "application/vnd.openofficeorg.extension",
	"osf": "application/vnd.yamaha.openscoreformat",
	"weba": "audio/webm",
	"webm": "video/webm",
	"odc": "application/vnd.oasis.opendocument.chart",
	"otc": "application/vnd.oasis.opendocument.chart-template",
	"odb": "application/vnd.oasis.opendocument.database",
	"odf": "application/vnd.oasis.opendocument.formula",
	"odft": "application/vnd.oasis.opendocument.formula-template",
	"odg": "application/vnd.oasis.opendocument.graphics",
	"otg": "application/vnd.oasis.opendocument.graphics-template",
	"odi": "application/vnd.oasis.opendocument.image",
	"oti": "application/vnd.oasis.opendocument.image-template",
	"odp": "application/vnd.oasis.opendocument.presentation",
	"otp": "application/vnd.oasis.opendocument.presentation-template",
	"ods": "application/vnd.oasis.opendocument.spreadsheet",
	"ots": "application/vnd.oasis.opendocument.spreadsheet-template",
	"odt": "application/vnd.oasis.opendocument.text",
	"odm": "application/vnd.oasis.opendocument.text-master",
	"ott": "application/vnd.oasis.opendocument.text-template",
	"ktx": "image/ktx",
	"sxc": "application/vnd.sun.xml.calc",
	"stc": "application/vnd.sun.xml.calc.template",
	"sxd": "application/vnd.sun.xml.draw",
	"std": "application/vnd.sun.xml.draw.template",
	"sxi": "application/vnd.sun.xml.impress",
	"sti": "application/vnd.sun.xml.impress.template",
	"sxm": "application/vnd.sun.xml.math",
	"sxw": "application/vnd.sun.xml.writer",
	"sxg": "application/vnd.sun.xml.writer.global",
	"stw": "application/vnd.sun.xml.writer.template",
	"otf": "application/x-font-otf",
	"osfpvg": "application/vnd.yamaha.openscoreformat.osfpvg+xml",
	"dp": "application/vnd.osgi.dp",
	"pdb": "application/vnd.palm",
	"p": "text/x-pascal",
	"paw": "application/vnd.pawaafile",
	"pclxl": "application/vnd.hp-pclxl",
	"efif": "application/vnd.picsel",
	"pcx": "image/x-pcx",
	"psd": "image/vnd.adobe.photoshop",
	"prf": "application/pics-rules",
	"pic": "image/x-pict",
	"chat": "application/x-chat",
	"p10": "application/pkcs10",
	"p12": "application/x-pkcs12",
	"p7m": "application/pkcs7-mime",
	"p7s": "application/pkcs7-signature",
	"p7r": "application/x-pkcs7-certreqresp",
	"p7b": "application/x-pkcs7-certificates",
	"p8": "application/pkcs8",
	"plf": "application/vnd.pocketlearn",
	"pnm": "image/x-portable-anymap",
	"pbm": "image/x-portable-bitmap",
	"pcf": "application/x-font-pcf",
	"pfr": "application/font-tdpfr",
	"pgn": "application/x-chess-pgn",
	"pgm": "image/x-portable-graymap",
	"png": "image/x-png",
	"ppm": "image/x-portable-pixmap",
	"pskcxml": "application/pskc+xml",
	"pml": "application/vnd.ctc-posml",
	"ai": "application/postscript",
	"pfa": "application/x-font-type1",
	"pbd": "application/vnd.powerbuilder6",
	"pgp": "application/pgp-signature",
	"box": "application/vnd.previewsystems.box",
	"ptid": "application/vnd.pvi.ptid1",
	"pls": "application/pls+xml",
	"str": "application/vnd.pg.format",
	"ei6": "application/vnd.pg.osasli",
	"dsc": "text/prs.lines.tag",
	"psf": "application/x-font-linux-psf",
	"qps": "application/vnd.publishare-delta-tree",
	"wg": "application/vnd.pmi.widget",
	"qxd": "application/vnd.quark.quarkxpress",
	"esf": "application/vnd.epson.esf",
	"msf": "application/vnd.epson.msf",
	"ssf": "application/vnd.epson.ssf",
	"qam": "application/vnd.epson.quickanime",
	"qfx": "application/vnd.intu.qfx",
	"qt": "video/quicktime",
	"rar": "application/x-rar-compressed",
	"ram": "audio/x-pn-realaudio",
	"rmp": "audio/x-pn-realaudio-plugin",
	"rsd": "application/rsd+xml",
	"rm": "application/vnd.rn-realmedia",
	"bed": "application/vnd.realvnc.bed",
	"mxl": "application/vnd.recordare.musicxml",
	"musicxml": "application/vnd.recordare.musicxml+xml",
	"rnc": "application/relax-ng-compact-syntax",
	"rdz": "application/vnd.data-vision.rdz",
	"rdf": "application/rdf+xml",
	"rp9": "application/vnd.cloanto.rp9",
	"jisp": "application/vnd.jisp",
	"rtf": "application/rtf",
	"rtx": "text/richtext",
	"link66": "application/vnd.route66.link66+xml",
	"shf": "application/shf+xml",
	"st": "application/vnd.sailingtracker.track",
	"svg": "image/svg+xml",
	"sus": "application/vnd.sus-calendar",
	"sru": "application/sru+xml",
	"setpay": "application/set-payment-initiation",
	"setreg": "application/set-registration-initiation",
	"sema": "application/vnd.sema",
	"semd": "application/vnd.semd",
	"semf": "application/vnd.semf",
	"see": "application/vnd.seemail",
	"snf": "application/x-font-snf",
	"spq": "application/scvp-vp-request",
	"spp": "application/scvp-vp-response",
	"scq": "application/scvp-cv-request",
	"scs": "application/scvp-cv-response",
	"sdp": "application/sdp",
	"etx": "text/x-setext",
	"movie": "video/x-sgi-movie",
	"ifm": "application/vnd.shana.informed.formdata",
	"itp": "application/vnd.shana.informed.formtemplate",
	"iif": "application/vnd.shana.informed.interchange",
	"ipk": "application/vnd.shana.informed.package",
	"tfi": "application/thraud+xml",
	"shar": "application/x-shar",
	"rgb": "image/x-rgb",
	"slt": "application/vnd.epson.salt",
	"aso": "application/vnd.accpac.simply.aso",
	"imp": "application/vnd.accpac.simply.imp",
	"twd": "application/vnd.simtech-mindmapper",
	"csp": "application/vnd.commonspace",
	"saf": "application/vnd.yamaha.smaf-audio",
	"mmf": "application/vnd.smaf",
	"spf": "application/vnd.yamaha.smaf-phrase",
	"teacher": "application/vnd.smart.teacher",
	"svd": "application/vnd.svd",
	"rq": "application/sparql-query",
	"srx": "application/sparql-results+xml",
	"gram": "application/srgs",
	"grxml": "application/srgs+xml",
	"ssml": "application/ssml+xml",
	"skp": "application/vnd.koan",
	"sgml": "text/sgml",
	"sdc": "application/vnd.stardivision.calc",
	"sda": "application/vnd.stardivision.draw",
	"sdd": "application/vnd.stardivision.impress",
	"smf": "application/vnd.stardivision.math",
	"sdw": "application/vnd.stardivision.writer",
	"sgl": "application/vnd.stardivision.writer-global",
	"sm": "application/vnd.stepmania.stepchart",
	"sit": "application/x-stuffit",
	"sitx": "application/x-stuffitx",
	"sdkm": "application/vnd.solent.sdkm+xml",
	"xo": "application/vnd.olpc-sugar",
	"au": "audio/basic",
	"wqd": "application/vnd.wqd",
	"sis": "application/vnd.symbian.install",
	"smi": "application/smil+xml",
	"xsm": "application/vnd.syncml+xml",
	"bdm": "application/vnd.syncml.dm+wbxml",
	"xdm": "application/vnd.syncml.dm+xml",
	"sv4cpio": "application/x-sv4cpio",
	"sv4crc": "application/x-sv4crc",
	"sbml": "application/sbml+xml",
	"tsv": "text/tab-separated-values",
	"tiff": "image/tiff",
	"tao": "application/vnd.tao.intent-module-archive",
	"tar": "application/x-tar",
	"tcl": "application/x-tcl",
	"tex": "application/x-tex",
	"tfm": "application/x-tex-tfm",
	"tei": "application/tei+xml",
	"txt": "text/plain",
	"dxp": "application/vnd.spotfire.dxp",
	"sfs": "application/vnd.spotfire.sfs",
	"tsd": "application/timestamped-data",
	"tpt": "application/vnd.trid.tpt",
	"mxs": "application/vnd.triscape.mxs",
	"t": "text/troff",
	"tra": "application/vnd.trueapp",
	"ttf": "application/x-font-ttf",
	"ttl": "text/turtle",
	"umj": "application/vnd.umajin",
	"uoml": "application/vnd.uoml+xml",
	"unityweb": "application/vnd.unity",
	"ufd": "application/vnd.ufdl",
	"uri": "text/uri-list",
	"utz": "application/vnd.uiq.theme",
	"ustar": "application/x-ustar",
	"uu": "text/x-uuencode",
	"vcs": "text/x-vcalendar",
	"vcf": "text/x-vcard",
	"vcd": "application/x-cdlink",
	"vsf": "application/vnd.vsf",
	"wrl": "model/vrml",
	"vcx": "application/vnd.vcx",
	"mts": "model/vnd.mts",
	"vtu": "model/vnd.vtu",
	"vis": "application/vnd.visionary",
	"viv": "video/vnd.vivo",
	"ccxml": "application/ccxml+xml,",
	"vxml": "application/voicexml+xml",
	"src": "application/x-wais-source",
	"wbxml": "application/vnd.wap.wbxml",
	"wbmp": "image/vnd.wap.wbmp",
	"wav": "audio/x-wav",
	"davmount": "application/davmount+xml",
	"woff": "application/x-font-woff",
	"wspolicy": "application/wspolicy+xml",
	"webp": "image/webp",
	"wtb": "application/vnd.webturbo",
	"wgt": "application/widget",
	"hlp": "application/winhlp",
	"wml": "text/vnd.wap.wml",
	"wmls": "text/vnd.wap.wmlscript",
	"wmlsc": "application/vnd.wap.wmlscriptc",
	"wpd": "application/vnd.wordperfect",
	"stf": "application/vnd.wt.stf",
	"wsdl": "application/wsdl+xml",
	"xbm": "image/x-xbitmap",
	"xpm": "image/x-xpixmap",
	"xwd": "image/x-xwindowdump",
	"der": "application/x-x509-ca-cert",
	"fig": "application/x-xfig",
	"xhtml": "application/xhtml+xml",
	"xml": "application/rss+xml",
	"xdf": "application/xcap-diff+xml",
	"xenc": "application/xenc+xml",
	"xer": "application/patch-ops-error+xml",
	"rl": "application/resource-lists+xml",
	"rs": "application/rls-services+xml",
	"rld": "application/resource-lists-diff+xml",
	"xslt": "application/xslt+xml",
	"xop": "application/xop+xml",
	"xpi": "application/x-xpinstall",
	"xspf": "application/xspf+xml",
	"xul": "application/vnd.mozilla.xul+xml",
	"xyz": "chemical/x-xyz",
	"yaml": "text/yaml",
	"yang": "application/yang",
	"yin": "application/yin+xml",
	"zir": "application/vnd.zul",
	"zip": "application/zip",
	"zmm": "application/vnd.handheld-entertainment+xml",
	"zaz": "application/vnd.zzazz.deck+xml",
	"atom": "application/atom+xml",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"rss": "application/rss+xml"
};

export class UploadedFile {
	#content;
	#contentType;
	#fileName;

	constructor(content, contentType = 'application/octet-stream', fileName = '') {
		this.#content = content;
		this.#contentType = contentType;
		this.#fileName = fileName;
	}

	getContent() {
		return this.#content;
	}

	getContentType() {
		return this.#contentType;
	}

	getFileName() {
		return this.#fileName;
	}
}

export class Request {
	#method;
	#headers = {};
	#path;
	#queryParams = {};
	#pathParams = {};

	#bodyPromise;
	#allParams;
	#cookies;

	#request;
	#customData = null;

	constructor(request) {
		this.#request = request;

		let url = new URL(`http://localhost${request.url}`);

		this.#method = request.method.toUpperCase();

		for (const k in request.headers) {
			this.#headers[k.toLowerCase()] = request.headers[k];
		}

		this.#path = url.pathname.split('/').filter(x => x).join('/');

		url.searchParams.forEach((v, k) => {
			this.#queryParams[k] = v;
		});
	}

	getMethod() {
		return this.#method;
	}

	getHeaders() {
		return this.#headers;
	}

	getPath() {
		return this.#path;
	}

	getQueryParams() {
		return this.#queryParams;
	}

	setPathParams(params) {
		this.#pathParams = params;
	}

	getPathParams() {
		return this.#pathParams;
	}

	async getBody() {
		if (!this.#bodyPromise) {
			this.#bodyPromise = new Promise((resolve, reject) => {
				const contentType = this.#headers['content-type'] ?? '';

				if (this.#method === 'GET' && !contentType.includes('application/x-www-form-urlencoded')) {
					resolve(this.#normalizeFormFields(this.#queryParams));
				}

				let body = [];

				this.#request.on('data', (chunk) => {
					body.push(chunk);
				}).on('end', async () => {
					body = Buffer.concat(body);

					if (contentType.includes('application/x-www-form-urlencoded')) {
						try {
							resolve(this.#parseUrlEncodedForm(body));
						} catch (error) {
							reject(error);
						}
					} else if (contentType.includes('multipart/form-data')) {
						try {
							resolve(await this.#parseMultipart(body, contentType));
						} catch (error) {
							reject(error);
						}
					} else if (contentType.includes('application/json')) {
						try {
							resolve(JSON.parse(body.toString()));
						} catch (error) {
							reject(error);
						}
					} else {
						resolve(body);
					}
				}).on('timeout', (error) => {
					reject(error);
				}).on('error', (error) => {
					reject(error);
				});
			});
		}

		return await this.#bodyPromise;
	}

	#normalizeFormFields(fields) {
		const result = {};

		for (const property in fields) {
			const newpProp = property.replace(/\s+/gm, '').replaceAll('[]', '[-1]');
			const pathToProperty = newpProp.split(/]\[|]|\[|\./gm).filter(x => x);

			let parent = result;

			for (let i = 0; i < pathToProperty.length; ++i) {
				const curFragment = pathToProperty[i];
				const nextFragment = i < pathToProperty.length - 1 ? pathToProperty[i + 1] : null;

				const nextParent = parent[curFragment] ?? (nextFragment ? (nextFragment.match(/^-?\d+$/gm) ? [] : {}) : fields[property]);

				if (typeof parent === 'object') {
					if (parent instanceof Array && curFragment.match(/^-?\d+$/gm)) {
						const index = Math.min(+curFragment, parent.length + 10000);

						if (index <= -1) {
							if (nextParent instanceof Array) {
								parent.push(...nextParent);
							} else if (nextParent !== null) {
								parent.push(nextParent);
							}
						} else {
							while (parent.length <= index) {
								parent.push(null);
							}

							parent[index] = nextParent;
						}
					} else if (!(parent instanceof Array) && !curFragment.match(/^-?\d+$/gm)) {
						parent[curFragment] = nextParent;
					} else {
						break;
					}
				} else {
					break;
				}

				parent = nextParent;
			}
		}

		return result;
	}

	async #parseMultipart(body, header) {
		const boundaryString = header.match(/(?<=boundary=)\S+/gm)?.[0];

		const boundaryBuffer = Buffer.from('--' + boundaryString);
		const partPositions = [];
		let lastPosition = { start: -1, end: -1 };

		function isBoundaryEnd(boundary, index, b) {
			let i = boundary.length - 1;

			if (index < i) {
				return false;
			}

			do {
				if (boundary[i--] !== b[index--]) {
					return false;
				}
			} while (i >= 0);

			return true;
		}

		const maxSyncProcessedChunkSize = 40000000;

		for (let offset = 0; offset < body.length; offset += maxSyncProcessedChunkSize) {
			const offsetEnd = Math.min(body.length, offset + maxSyncProcessedChunkSize);

			for (let i = offset; i < offsetEnd; ++i) {
				if (isBoundaryEnd(boundaryBuffer, i, body)) {
					lastPosition.end = i - boundaryBuffer.length - 1;

					lastPosition = {
						start: i + 3,
						end: -1,
					};

					partPositions.push(lastPosition);
				}
			}

			if (offsetEnd < body.length) {
				await new Promise((resolve) => setTimeout(resolve, 30));
			}
		}

		partPositions.pop();

		const newLineBuffer = Buffer.from('\r\n\r\n');

		const data = {};

		for (const position of partPositions) {
			let end = position.end;

			for (let i = position.start; i < position.end; ++i) {
				if (isBoundaryEnd(newLineBuffer, i, body)) {
					end = i - 3;
					break;
				}
			}

			const info = body.toString('utf-8', position.start, end);

			const name = decodeURIComponent(info.match(/(?<=name=")[^"]*/gm)?.[0] ?? '');
			const fileName = decodeURIComponent(info.match(/(?<=filename=")[^"]*/gm)?.[0] ?? '');
			const contentType = info.match(/(?<=^Content-Type:)[^\n]+/gm)?.[0]?.trim() ?? '';

			if (!name) {
				continue;
			}

			let value = null;

			if (contentType) {
				if (fileName) {
					value = new UploadedFile(
						body.slice(end + 4, position.end),
						contentType,
						fileName
					);
				}
			} else {
				value = end === position.end ? '' : body.slice(end + 4, position.end).toString()
			}

			if (name in data && !Array.isArray(data[name])) {
				data[name] = [data[name]];
			}

			if (Array.isArray(data[name])) {
				if (value != null) {
					data[name].push(value);
				}

			} else {
				data[name] = value;
			}
		}

		return this.#normalizeFormFields(data);
	}

	#parseUrlEncodedForm(body) {
		const data = querystring.parse(body.toString());
		return this.#normalizeFormFields(data);
	}

	async getAllParams() {
		if (!this.#allParams) {
			const body = await this.getBody();

			this.#allParams = {
				...this.#queryParams,
				...this.#pathParams,
				...(typeof body === 'object' ? body : { body }),
			}
		}

		return this.#allParams;
	}

	getCookies() {
		if (!this.#cookies) {
			this.#cookies = Object.fromEntries(
				(this.#headers?.['cookie'] ?? '')
					.split(/\s*;\s*/gm)
					.map(s => s.split(/\s*=\s*/gm))
					.map(x => [decodeURIComponent(x[0] ?? ''), decodeURIComponent(x[1] ?? '')])
			);
		}

		return this.#cookies;
	}

	setCustomData(data) {
		this.#customData = data;
	}

	getCustomData() {
		return this.#customData;
	}
}

export class Response {
	#cookies;
	#addedCustomHeaders = {};

	getCode() {
		return 200;
	}

	getHeaders() {
		return this.getMergedWithOtherHeaders({ 'Content-Type': 'text/plain' });
	}

	getBody() {
		'';
	}

	setCookies(cookies) {
		this.#cookies = cookies;
	}

	addCookies(cookies) {
		this.#cookies = this.#cookies ? { ...this.#cookies, ...cookies } : cookies;
	}

	getCookies() {
		return this.#cookies ?? {};
	}

	addCustomHeaders(customHeaders) {
		this.#addedCustomHeaders = { ...this.#addedCustomHeaders, ...customHeaders };
	}

	getMergedWithOtherHeaders(headers) {
		if (this.#cookies) {
			let cookieStrings = [];
			const maxAge = 60 * 60 * 24 * 365 * 5;

			for (const k in this.#cookies) {
				let cookieValue = this.#cookies[k];

				if (cookieValue === null || cookieValue === undefined) {
					cookieValue = { value: '', maxAge: 0 };
				} if (!(cookieValue instanceof Object)) {
					cookieValue = { value: cookieValue };
				}

				cookieValue = { maxage: maxAge, path: '/', ...cookieValue };
				let cookieString = `${encodeURIComponent(k)}=${encodeURIComponent(cookieValue.value ?? '')}`;

				for (const prop in cookieValue) {
					const name = prop.split('-').join('').toLowerCase();

					const attributeName = {
						'domain': 'Domain',
						'expires': 'Expires',
						'httponly': 'HttpOnly',
						'maxage': 'Max-Age',
						'partitioned': 'Partitioned',
						'path': 'Path',
						'samesite': 'Samesite',
						'secure': 'Secure',
					}[name];

					let attributeValue = cookieValue[prop];

					if (attributeName) {
						if (!['httponly', 'partitioned', 'secure'].includes(name)) {
							if (attributeValue instanceof Date) {
								attributeValue = attributeValue.toUTCString();
							} else if (name !== 'path') {
								attributeValue = encodeURIComponent(`${attributeValue}`);
							}

							cookieString += `; ${attributeName}=${attributeValue}`
						} else if (attributeValue) {
							cookieString += `; ${attributeName}`
						}
					}
				}
				cookieStrings.push(cookieString);
			}

			headers = {
				...headers,
				'Set-Cookie': cookieStrings,
			}
		}

		headers = {
			...headers,
			...this.#addedCustomHeaders,
		}

		for (const key of Object.keys(headers)) {
			if (headers[key] === null || headers[key] === undefined) {
				delete headers[key];
			}
		}

		return headers;
	}
}

export class CustomResponse extends Response {
	#code;
	#data;
	#headers;

	constructor(data, code = 200, headers = { 'Content-Type': 'application/octet-stream' }, cookies = null) {
		super();
		this.#data = data;
		this.#code = code;
		this.#headers = headers;
		this.setCookies(cookies);
	}

	getCode() {
		return this.#code;
	}

	getHeaders() {
		return this.getMergedWithOtherHeaders(this.#headers);
	}

	getBody() {
		return this.#data;
	}

	getData() {
		return this.#data;
	}

	setData(data) {
		this.#data = data;
	}
}

export class FileResponse extends Response {
	#code;
	#filePath;
	#contentType;

	#dataPromise = null;

	#maxChunkSize = 4 * 1024 * 1024;
	#fragmentRequestMap = new WeakMap();

	constructor(filePath, code = 200, contentType = null, cookies = null) {
		super();
		this.#filePath = filePath;
		this.#code = code;
		this.#contentType = contentType;
		this.setCookies(cookies);
	}

	async getCode(headers = null) {
		const requestedFragment = await this.#getFragmentRequest(headers);
		const data = await this.#retreiveData();

		if (requestedFragment) {
			return 206;
		}

		return data.code;
	}

	async getHeaders(headers = null) {
		const requestedFragment = await this.#getFragmentRequest(headers);
		const data = await this.#retreiveData();

		if (requestedFragment) {
			return {
				...data.headers,
				'Content-Range': `bytes ${requestedFragment.offset}-${requestedFragment.offset + requestedFragment.size - 1}/${data.size}`,
				'Content-Length': `${requestedFragment.size}`,

			};
		}

		return data.headers;
	}

	async getBody(headers = null) {
		const requestedFragment = await this.#getFragmentRequest(headers);
		const data = await this.#retreiveData();

		if (requestedFragment) {
			return () => data.body(requestedFragment);
		}

		return data.body;
	}

	getFilePath() {
		return this.#filePath;
	}

	setFilePath(filePath) {
		this.#filePath = filePath;
		this.#dataPromise = null;
	}

	async #getFragmentRequest(headers) {
		let result = this.#fragmentRequestMap.get(headers);

		if (result === undefined && headers?.['range']) {
			if (headers['range'].includes(',')) {
				this.#fragmentRequestMap.set(headers, null);
				return null;
			}

			const numbers = headers['range']
				.trim()
				.replace('bytes=', '')
				.split(/\b\s*-\s*/gm)
				.map(x => {
					x = +x;

					if (!x || isNaN(x) || x < Number.MIN_SAFE_INTEGER || x > Number.MAX_SAFE_INTEGER) {
						return null;
					}

					return Math.floor(x);
				});

			const data = await this.#retreiveData();

			if (data.code < 200 || data.code > 299 || typeof data.body !== 'function') {
				this.#fragmentRequestMap.set(headers, null);
				return null;
			}

			let offset = numbers[0] ?? 0;

			if (offset < 0) {
				offset = data.size + offset;
			}

			if (offset >= data.size) {
				offset = data.size - 1;
			}

			let size = (numbers[1] ?? (this.#maxChunkSize - 1 + offset)) - offset + 1;

			if (size < 0) {
				size = 0;
			}

			size = Math.min(size, data.size - offset);

			result = {
				offset,
				size,
			};

			this.#fragmentRequestMap.set(headers, result);
		}

		return result ?? null;
	}

	async * #getBodyStream(fragmentRequest) {
		const data = await this.#retreiveData();

		if (typeof data.body !== 'function') {
			yield data.body;
			return;
		}

		let filehandle;

		try {
			const requestedPosition = fragmentRequest?.offset ?? 0;
			const requestedSize = fragmentRequest?.size ?? data.size;

			filehandle = await fs.open(this.#filePath, 'r');

			for (let offset = 0; offset < requestedSize; offset += this.#maxChunkSize) {
				const size = Math.min(this.#maxChunkSize, requestedSize - offset);
				const chunk = await filehandle.read(Buffer.alloc(size), 0, size, offset + requestedPosition);
				yield chunk.buffer;
			}
		} finally {
			filehandle?.close();
		}
	}

	#retreiveData() {
		if (!this.#dataPromise) {
			this.#dataPromise = new Promise(async (resolve) => {
				let filehandle;

				try {
					filehandle = await fs.open(this.#filePath, 'r');
					const size = (await filehandle.stat()).size;
					const body = size > this.#maxChunkSize ? (fragmentRequest => this.#getBodyStream(fragmentRequest)) : await filehandle.readFile();

					resolve({
						code: this.#code,
						headers: this.getMergedWithOtherHeaders({
							'Content-Type': this.#contentType ?? mimeTypes[this.#filePath.split('.').at(-1).toLowerCase()] ?? 'application/octet-stream',
							'Content-Length': size,
						}
						),
						body,
						size,
					});
				} catch (e) {
					console.error(e);
					resolve({
						code: 404,
						headers: this.getMergedWithOtherHeaders({ 'Content-Type': 'application/json' }),
						body: JSON.stringify({
							message: `File not found`
						})
					});
				} finally {
					await filehandle?.close();
				}
			});
		}

		return this.#dataPromise;
	}
}

export class JsonResponse extends Response {
	#object;
	#code;

	constructor(object = {}, code = 200, cookies = null) {
		super();
		this.setCookies(cookies);
		this.#object = object;
		this.#code = code;
	}

	getCode() {
		return this.#code;
	}

	getHeaders() {
		return this.getMergedWithOtherHeaders({ 'Content-Type': 'application/json' });
	}

	getBody() {
		return JSON.stringify(this.#object);
	}

	getObject() {
		return this.#object;
	}

	setObject(object) {
		this.#object = object;
	}
}

export class HTMLResponse extends Response {
	#string;
	#code;

	constructor(string = '', code = 200, cookies = null) {
		super();
		this.setCookies(cookies);
		this.#string = string;
		this.#code = code;
	}

	getCode() {
		return this.#code;
	}

	getHeaders() {
		return this.getMergedWithOtherHeaders({ 'Content-Type': 'text/html; charset=utf-8' });
	}

	getBody() {
		return this.#string;
	}

	getString() {
		return this.#string;
	}

	setString(string) {
		this.#string = string;
	}
}

export class RedirectResponse extends Response {
	#url;
	#code;

	constructor(url, code = 301, cookies = null) {
		super();
		this.setCookies(cookies);
		this.#url = url;
		this.#code = code;
	}

	getCode() {
		return this.#code;
	}

	getHeaders() {
		return this.getMergedWithOtherHeaders({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Location': this.#url, });
	}

	getBody() {
		return '';
	}

	getUrl() {
		return this.#url;
	}

	setUrl(url) {
		this.#url = url;
	}
}

export function serve(routes, port = 80, staticFileDirectory = null) {
	port = +port;
	routes = normalizeRoutes(routes);
	console.log(routes);

	if (staticFileDirectory !== null && staticFileDirectory !== undefined) {
		staticFileDirectory = `${staticFileDirectory}`.split('/').filter(x => x).join('/');
	}

	try {
		unserve(port);

		const server = http.createServer(async (req, res) => {
			try {
				const [code, headers, body] = await handleRequest(req, routes, staticFileDirectory);
				res.writeHead(code, headers);

				if (typeof body === 'function') {
					for await (const chunk of body()) {
						if (res.closed || res.destroyed) {
							break;
						}

						res.write(chunk);
						let waitTime = 0;

						while (res.writableNeedDrain && !res.closed && !res.destroyed && waitTime < keepAliveTimeout) {
							await new Promise(resolve => setTimeout(resolve, 50));
							waitTime += 50;
						}
					}
				} else {
					res.write(body);
				}
			} catch (error) {
				console.error(error);
			} finally {
				res.end();
			}
		});

		servers.set(port, server);

		server.keepAliveTimeout = keepAliveTimeout;
		server.headersTimeout = keepAliveTimeout;

		server.on('error', (error) => {
			unserve(port);
			console.error(error);
		});

		server.listen(port, () => {
			console.log(`Server started on port ${port}`);
		});
	} catch (e) {
		console.error(e);
	}


}

export function escapeHtml(htmlStr) {
	return htmlStr?.toString().replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;") ?? '';
}

export function unserve(port = 80) {
	port = +port;

	servers.get(port)?.close(() => {
		console.log(`Server closed on port ${port}`);
	});

	servers.delete(port);
}

function normalizeRoutes(routes) {
	const flatten = {};

	function flattenRecursively(root, path = '', preMiddlewares = [], postMiddlewares = []) {
		if (!root) {
			return;
		}

		if (root.preMiddlewares instanceof Array) {
			preMiddlewares = [...preMiddlewares, ...root.preMiddlewares];
		}

		if (root.postMiddlewares instanceof Array) {
			postMiddlewares = [...root.postMiddlewares, ...postMiddlewares];
		}

		if (root && typeof root === 'object' && !Array.isArray(root)) {
			for (const prop in root) {
				const newPath = (path + '/' + prop).split('/').filter(x => x).join('/');
				flattenRecursively(root[prop], newPath, preMiddlewares, postMiddlewares);
			}
		} else if (typeof root === 'function') {
			flatten[path] = async (request, handleOptions = false) => {
				let response;

				try {
					for (const pre of preMiddlewares) {
						const req = await pre(request);

						if (req instanceof Request) {
							request = req;
						}
					}

					response = wrapInResponseClass(handleOptions ? new CustomResponse(Buffer.from(''), 200, { 'Content-Type': null }) : await root(request));
				} catch (error) {
					if (error instanceof Response) {
						response = error;
					} else {
						throw error;
					}
				}

				for (const post of postMiddlewares) {
					const res = await post(request, response);

					if (res !== undefined) {
						response = wrapInResponseClass(res);
					}
				}

				return response;
			};
		}
	}

	flattenRecursively(routes);

	const result = {};

	for (const route in flatten) {
		const split = route.split('/').filter(x => x);
		let method = split.at(-1)?.toUpperCase();

		if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method)) {
			split.pop();
		} else {
			method = 'GET'
		}

		let parent = result;

		for (const fragment of split) {
			if (!parent[fragment]) {
				parent[fragment] = {};
			}

			parent = parent[fragment];
		}

		parent[`/${method}/`] = flatten[route];
	}

	return result;
}

function wrapInResponseClass(response) {
	if (!(response instanceof Response)) {
		if (typeof response === 'object') {
			response = new JsonResponse(response, 200);
		} else {
			response = new HTMLResponse(`${response ?? ''}`, 200);
		}
	}

	return response;
}

const staticCache = new Map();

export function clearStaticCache(path = null) {
	if (path === null) {
		staticCache.clear();
	} else {
		staticCache.delete(path);
	}
}

async function handleRequest(req, routes, staticFileDirectory) {
	let response = new JsonResponse({
		message: 'Invalid data'
	}, 400);

	let requestHeaders;

	try {
		const request = new Request(req);

		const method = request.getMethod();
		const path = request.getPath();
		const pathParams = {};
		requestHeaders = request.getHeaders();

		let routeHandler = routes;
		let handleOptions = false;

		if (staticFileDirectory && method === 'GET' && path.startsWith(staticFileDirectory)) {
			routeHandler = () => {
				const filePath = decodeURI(path);

				let resp = staticCache.get(filePath);

				if (!resp) {
					resp = new FileResponse(decodeURI(path));
					resp.addCustomHeaders({
						'Cache-Control': 'public, max-age=432000',
					});
					staticCache.set(filePath, resp);
				}

				return resp;
			};
		} else {
			for (const fragment of path.split('/')) {
				if (!fragment) {
					break;
				}

				let newRouteHandler = routeHandler[fragment];

				if (!newRouteHandler) {
					for (let k in routeHandler) {
						if (k.match(/^{\w+}$/gm)) {
							pathParams[k.replace(/[{}]/gm, '')] = decodeURIComponent(fragment);
							newRouteHandler = routeHandler[k];
							break;
						}
					}
				}

				routeHandler = newRouteHandler;

				if (!routeHandler) {
					break;
				}
			}


			if (method === 'OPTIONS' && typeof routeHandler?.[`/${method}/`] !== 'function') {
				handleOptions = true;
				routeHandler = routeHandler?.[`/${requestHeaders?.['access-control-request-method']}/`.toUpperCase()];
			} else {
				routeHandler = routeHandler?.[`/${method}/`];
			}
		}

		if (typeof routeHandler === 'function') {
			request.setPathParams(pathParams);
			response = await routeHandler(request, handleOptions);
		} else {
			response = new JsonResponse({
				message: `Route ${method} "${path}" not found`
			}, 404);
		}

		request.setPathParams(pathParams);
	} catch (error) {
		if (error instanceof Response) {
			response = error;
		} else {
			console.error(error);

			response = new JsonResponse({
				message: 'Something went wrong'
			}, 500);
		}
	}

	try {
		return [await response.getCode(requestHeaders), await response.getHeaders(requestHeaders), await response.getBody(requestHeaders)];
	} catch (error) {
		console.error(error);

		response = new JsonResponse({
			message: 'Something went wrong'
		}, 500);

		return [response.getCode(), response.getHeaders(), response.getBody()];
	}
}