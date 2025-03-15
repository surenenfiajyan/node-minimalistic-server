import * as http from 'node:http';
import * as querystring from "node:querystring";
import * as fs from "node:fs/promises";
import * as tls from "node:tls";
import * as nodeCrypto from "node:crypto";
import { isTypedArray } from 'node:util/types';
import { inspect } from 'node:util';

const servers = new Map();
const keepAliveTimeout = 20000;

let currentFsPromiseModule = fs;

function safePrint(data, isError = false) {
	try {
		if (isError) {
			console.error(data);
			console.trace('Stack trace');
		} else {
			console.log(data);
		}
	} catch (e) {
		console.error('Error printing data');
		console.trace('Stack trace');
	}
}

const mimeTypes = {
	"123": "application/vnd.lotus-1-2-3",
	"3dml": "text/vnd.in3d.3dml",
	"3g2": "video/3gpp2",
	"3gp": "video/3gpp",
	"7z": "application/x-7z-compressed",
	"aab": "application/x-authorware-bin",
	"aac": "audio/aac",
	"aam": "application/x-authorware-map",
	"aas": "application/x-authorware-seg",
	"abw": "application/x-abiword",
	"ac": "application/pkix-attr-cert",
	"acc": "application/vnd.americandynamics.acc",
	"ace": "application/x-ace-compressed",
	"acu": "application/vnd.acucobol",
	"adp": "audio/adpcm",
	"aep": "application/vnd.audiograph",
	"afp": "application/vnd.ibm.modcap",
	"ahead": "application/vnd.ahead.space",
	"ai": "application/postscript",
	"aif": "audio/x-aiff",
	"aifc": "audio/x-aiff",
	"aiff": "audio/x-aiff",
	"air": "application/vnd.adobe.air-application-installer-package+zip",
	"ait": "application/vnd.dvb.ait",
	"ami": "application/vnd.amiga.ami",
	"apk": "application/vnd.android.package-archive",
	"apng": "image/apng",
	"application": "application/x-ms-application",
	"apr": "application/vnd.lotus-approach",
	"arc": "application/x-freearc",
	"asf": "video/x-ms-asf",
	"aso": "application/vnd.accpac.simply.aso",
	"atc": "application/vnd.acucorp",
	"atom": "application/atom+xml",
	"atomcat": "application/atomcat+xml",
	"atomsvc": "application/atomsvc+xml",
	"atx": "application/vnd.antix.game-component",
	"au": "audio/basic",
	"avi": "video/x-msvideo",
	"avif": "image/avif",
	"aw": "application/applixware",
	"azf": "application/vnd.airzip.filesecure.azf",
	"azs": "application/vnd.airzip.filesecure.azs",
	"azw": "application/vnd.amazon.ebook",
	"bcpio": "application/x-bcpio",
	"bdf": "application/x-font-bdf",
	"bdm": "application/vnd.syncml.dm+wbxml",
	"bed": "application/vnd.realvnc.bed",
	"bh2": "application/vnd.fujitsu.oasysprs",
	"bin": "application/octet-stream",
	"bmi": "application/vnd.bmi",
	"bmp": "image/bmp",
	"box": "application/vnd.previewsystems.box",
	"btif": "image/prs.btif",
	"bz": "application/x-bzip",
	"bz2": "application/x-bzip2",
	"c": "text/x-c",
	"c11amc": "application/vnd.cluetrust.cartomobile-config",
	"c11amz": "application/vnd.cluetrust.cartomobile-config-pkg",
	"c4g": "application/vnd.clonk.c4group",
	"cab": "application/vnd.ms-cab-compressed",
	"car": "application/vnd.curl.car",
	"cat": "application/vnd.ms-pki.seccat",
	"ccxml": "application/ccxml+xml,",
	"cdbcmsg": "application/vnd.contact.cmsg",
	"cdkey": "application/vnd.mediastation.cdkey",
	"cdmia": "application/cdmi-capability",
	"cdmic": "application/cdmi-container",
	"cdmid": "application/cdmi-domain",
	"cdmio": "application/cdmi-object",
	"cdmiq": "application/cdmi-queue",
	"cdx": "chemical/x-cdx",
	"cdxml": "application/vnd.chemdraw+xml",
	"cdy": "application/vnd.cinderella",
	"cer": "application/pkix-cert",
	"cgm": "image/cgm",
	"chat": "application/x-chat",
	"chm": "application/vnd.ms-htmlhelp",
	"chrt": "application/vnd.kde.kchart",
	"cif": "chemical/x-cif",
	"cii": "application/vnd.anser-web-certificate-issue-initiation",
	"cil": "application/vnd.ms-artgalry",
	"cla": "application/vnd.claymore",
	"class": "application/java-vm",
	"clkk": "application/vnd.crick.clicker.keyboard",
	"clkp": "application/vnd.crick.clicker.palette",
	"clkt": "application/vnd.crick.clicker.template",
	"clkw": "application/vnd.crick.clicker.wordbank",
	"clkx": "application/vnd.crick.clicker",
	"clp": "application/x-msclip",
	"cmc": "application/vnd.cosmocaller",
	"cmdf": "chemical/x-cmdf",
	"cml": "chemical/x-cml",
	"cmp": "application/vnd.yellowriver-custom-menu",
	"cmx": "image/x-cmx",
	"cod": "application/vnd.rim.cod",
	"cpio": "application/x-cpio",
	"cpt": "application/mac-compactpro",
	"crd": "application/x-mscardfile",
	"crl": "application/pkix-crl",
	"cryptonote": "application/vnd.rig.cryptonote",
	"csh": "application/x-csh",
	"csml": "chemical/x-csml",
	"csp": "application/vnd.commonspace",
	"css": "text/css",
	"csv": "text/csv",
	"cu": "application/cu-seeme",
	"curl": "text/vnd.curl",
	"cww": "application/prs.cww",
	"dae": "model/vnd.collada+xml",
	"daf": "application/vnd.mobius.daf",
	"davmount": "application/davmount+xml",
	"dcurl": "text/vnd.curl.dcurl",
	"dd2": "application/vnd.oma.dd2+xml",
	"ddd": "application/vnd.fujixerox.ddd",
	"deb": "application/x-debian-package",
	"der": "application/x-x509-ca-cert",
	"dfac": "application/vnd.dreamfactory",
	"dir": "application/x-director",
	"dis": "application/vnd.mobius.dis",
	"djvu": "image/vnd.djvu",
	"dmg": "application/x-apple-diskimage",
	"dna": "application/vnd.dna",
	"doc": "application/msword",
	"docm": "application/vnd.ms-word.document.macroenabled.12",
	"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"dotm": "application/vnd.ms-word.template.macroenabled.12",
	"dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
	"dp": "application/vnd.osgi.dp",
	"dpg": "application/vnd.dpgraph",
	"dra": "audio/vnd.dra",
	"dsc": "text/prs.lines.tag",
	"dssc": "application/dssc+der",
	"dtb": "application/x-dtbook+xml",
	"dtd": "application/xml-dtd",
	"dts": "audio/vnd.dts",
	"dtshd": "audio/vnd.dts.hd",
	"dvi": "application/x-dvi",
	"dwf": "model/vnd.dwf",
	"dwg": "image/vnd.dwg",
	"dxf": "image/vnd.dxf",
	"dxp": "application/vnd.spotfire.dxp",
	"ecelp4800": "audio/vnd.nuera.ecelp4800",
	"ecelp7470": "audio/vnd.nuera.ecelp7470",
	"ecelp9600": "audio/vnd.nuera.ecelp9600",
	"edm": "application/vnd.novadigm.edm",
	"edx": "application/vnd.novadigm.edx",
	"efif": "application/vnd.picsel",
	"ei6": "application/vnd.pg.osasli",
	"eml": "message/rfc822",
	"emma": "application/emma+xml",
	"eol": "audio/vnd.digital-winds",
	"eot": "application/vnd.ms-fontobject",
	"epub": "application/epub+zip",
	"es": "application/ecmascript",
	"es3": "application/vnd.eszigno3+xml",
	"esf": "application/vnd.epson.esf",
	"etx": "text/x-setext",
	"exe": "application/x-msdownload",
	"exi": "application/exi",
	"ext": "application/vnd.novadigm.ext",
	"ez2": "application/vnd.ezpix-album",
	"ez3": "application/vnd.ezpix-package",
	"f": "text/x-fortran",
	"f4v": "video/x-f4v",
	"fbs": "image/vnd.fastbidsheet",
	"fcs": "application/vnd.isac.fcs",
	"fdf": "application/vnd.fdf",
	"fe_launch": "application/vnd.denovo.fcselayout-link",
	"fg5": "application/vnd.fujitsu.oasysgp",
	"fh": "image/x-freehand",
	"fig": "application/x-xfig",
	"fli": "video/x-fli",
	"flo": "application/vnd.micrografx.flo",
	"flv": "video/x-flv",
	"flw": "application/vnd.kde.kivio",
	"flx": "text/vnd.fmi.flexstor",
	"fly": "text/vnd.fly",
	"fm": "application/vnd.framemaker",
	"fnc": "application/vnd.frogans.fnc",
	"fpx": "image/vnd.fpx",
	"fsc": "application/vnd.fsc.weblaunch",
	"fst": "image/vnd.fst",
	"ftc": "application/vnd.fluxtime.clip",
	"fti": "application/vnd.anser-web-funds-transfer-initiation",
	"fvt": "video/vnd.fvt",
	"fxp": "application/vnd.adobe.fxp",
	"fzs": "application/vnd.fuzzysheet",
	"g2w": "application/vnd.geoplan",
	"g3": "image/g3fax",
	"g3w": "application/vnd.geospace",
	"gac": "application/vnd.groove-account",
	"gdl": "model/vnd.gdl",
	"geo": "application/vnd.dynageo",
	"gex": "application/vnd.geometry-explorer",
	"ggb": "application/vnd.geogebra.file",
	"ggt": "application/vnd.geogebra.tool",
	"ghf": "application/vnd.groove-help",
	"gif": "image/gif",
	"gim": "application/vnd.groove-identity-message",
	"gmx": "application/vnd.gmx",
	"gnumeric": "application/x-gnumeric",
	"gph": "application/vnd.flographit",
	"gqf": "application/vnd.grafeq",
	"gram": "application/srgs",
	"grv": "application/vnd.groove-injector",
	"grxml": "application/srgs+xml",
	"gsf": "application/x-font-ghostscript",
	"gtar": "application/x-gtar",
	"gtm": "application/vnd.groove-tool-message",
	"gtw": "model/vnd.gtw",
	"gv": "text/vnd.graphviz",
	"gxt": "application/vnd.geonext",
	"h261": "video/h261",
	"h263": "video/h263",
	"h264": "video/h264",
	"hal": "application/vnd.hal+xml",
	"hbci": "application/vnd.hbci",
	"hdf": "application/x-hdf",
	"hlp": "application/winhlp",
	"hpgl": "application/vnd.hp-hpgl",
	"hpid": "application/vnd.hp-hpid",
	"hps": "application/vnd.hp-hps",
	"hqx": "application/mac-binhex40",
	"htke": "application/vnd.kenameaapp",
	"html": "text/html",
	"hvd": "application/vnd.yamaha.hv-dic",
	"hvp": "application/vnd.yamaha.hv-voice",
	"hvs": "application/vnd.yamaha.hv-script",
	"i2g": "application/vnd.intergeo",
	"icc": "application/vnd.iccprofile",
	"ice": "x-conference/x-cooltalk",
	"ico": "image/x-icon",
	"ics": "text/calendar",
	"ief": "image/ief",
	"ifm": "application/vnd.shana.informed.formdata",
	"igl": "application/vnd.igloader",
	"igm": "application/vnd.insors.igm",
	"igs": "model/iges",
	"igx": "application/vnd.micrografx.igx",
	"iif": "application/vnd.shana.informed.interchange",
	"imp": "application/vnd.accpac.simply.imp",
	"ims": "application/vnd.ms-ims",
	"ipfix": "application/ipfix",
	"ipk": "application/vnd.shana.informed.package",
	"irm": "application/vnd.ibm.rights-management",
	"irp": "application/vnd.irepository.package+xml",
	"itp": "application/vnd.shana.informed.formtemplate",
	"ivp": "application/vnd.immervision-ivp",
	"ivu": "application/vnd.immervision-ivu",
	"jad": "text/vnd.sun.j2me.app-descriptor",
	"jam": "application/vnd.jam",
	"jar": "application/java-archive",
	"java": "text/x-java-source,java",
	"jisp": "application/vnd.jisp",
	"jlt": "application/vnd.hp-jlyt",
	"jnlp": "application/x-java-jnlp-file",
	"joda": "application/vnd.joost.joda-archive",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"jpgv": "video/jpeg",
	"jpm": "video/jpm",
	"js": "text/javascript",
	"json": "application/json",
	"jsonld": "application/ld+json",
	"karbon": "application/vnd.kde.karbon",
	"kfo": "application/vnd.kde.kformula",
	"kia": "application/vnd.kidspiration",
	"kml": "application/vnd.google-earth.kml+xml",
	"kmz": "application/vnd.google-earth.kmz",
	"kne": "application/vnd.kinar",
	"kon": "application/vnd.kde.kontour",
	"kpr": "application/vnd.kde.kpresenter",
	"ksp": "application/vnd.kde.kspread",
	"ktx": "image/ktx",
	"ktz": "application/vnd.kahootz",
	"kwd": "application/vnd.kde.kword",
	"lasxml": "application/vnd.las.las+xml",
	"latex": "application/x-latex",
	"lbd": "application/vnd.llamagraphics.life-balance.desktop",
	"lbe": "application/vnd.llamagraphics.life-balance.exchange+xml",
	"les": "application/vnd.hhe.lesson-player",
	"link66": "application/vnd.route66.link66+xml",
	"lrm": "application/vnd.ms-lrm",
	"ltf": "application/vnd.frogans.ltf",
	"lvp": "audio/vnd.lucent.voice",
	"lwp": "application/vnd.lotus-wordpro",
	"m21": "application/mp21",
	"m3u": "audio/x-mpegurl",
	"m3u8": "application/vnd.apple.mpegurl",
	"m4a": "audio/mp4",
	"m4v": "video/x-m4v",
	"ma": "application/mathematica",
	"mads": "application/mads+xml",
	"mag": "application/vnd.ecowin.chart",
	"mathml": "application/mathml+xml",
	"mbk": "application/vnd.mobius.mbk",
	"mbox": "application/mbox",
	"mc1": "application/vnd.medcalcdata",
	"mcd": "application/vnd.mcd",
	"mcurl": "text/vnd.curl.mcurl",
	"mdb": "application/x-msaccess",
	"mdi": "image/vnd.ms-modi",
	"meta4": "application/metalink4+xml",
	"mets": "application/mets+xml",
	"mfm": "application/vnd.mfmp",
	"mgp": "application/vnd.osgeo.mapguide.package",
	"mgz": "application/vnd.proteus.magazine",
	"mid": "audio/midi",
	"midi": "audio/midi",
	"mif": "application/vnd.mif",
	"mj2": "video/mj2",
	"mjs": "text/javascript",
	"mkv": "video/x-matroska",
	"mlp": "application/vnd.dolby.mlp",
	"mmd": "application/vnd.chipnuts.karaoke-mmd",
	"mmf": "application/vnd.smaf",
	"mmr": "image/vnd.fujixerox.edmics-mmr",
	"mny": "application/x-msmoney",
	"mods": "application/mods+xml",
	"movie": "video/x-sgi-movie",
	"mp3": "audio/mpeg",
	"mp4": "video/mp4",
	"mp4a": "audio/mp4",
	"mpc": "application/vnd.mophun.certificate",
	"mpeg": "video/mpeg",
	"mpga": "audio/mpeg",
	"mpkg": "application/vnd.apple.installer+xml",
	"mpm": "application/vnd.blueice.multipass",
	"mpn": "application/vnd.mophun.application",
	"mpp": "application/vnd.ms-project",
	"mpy": "application/vnd.ibm.minipay",
	"mqy": "application/vnd.mobius.mqy",
	"mrc": "application/marc",
	"mrcx": "application/marcxml+xml",
	"mscml": "application/mediaservercontrol+xml",
	"mseq": "application/vnd.mseq",
	"msf": "application/vnd.epson.msf",
	"msh": "model/mesh",
	"msl": "application/vnd.mobius.msl",
	"msty": "application/vnd.muvee.style",
	"mts": "model/vnd.mts",
	"mus": "application/vnd.musician",
	"musicxml": "application/vnd.recordare.musicxml+xml",
	"mvb": "application/x-msmediaview",
	"mwf": "application/vnd.mfer",
	"mxf": "application/mxf",
	"mxl": "application/vnd.recordare.musicxml",
	"mxml": "application/xv+xml",
	"mxs": "application/vnd.triscape.mxs",
	"mxu": "video/vnd.mpegurl",
	"n-gage": "application/vnd.nokia.n-gage.symbian.install",
	"N/A": "application/andrew-inset",
	"n3": "text/n3",
	"nbp": "application/vnd.wolfram.player",
	"nc": "application/x-netcdf",
	"ncx": "application/x-dtbncx+xml",
	"ngdat": "application/vnd.nokia.n-gage.data",
	"nlu": "application/vnd.neurolanguage.nlu",
	"nml": "application/vnd.enliven",
	"nnd": "application/vnd.noblenet-directory",
	"nns": "application/vnd.noblenet-sealer",
	"nnw": "application/vnd.noblenet-web",
	"npx": "image/vnd.net-fpx",
	"nsf": "application/vnd.lotus-notes",
	"oa2": "application/vnd.fujitsu.oasys2",
	"oa3": "application/vnd.fujitsu.oasys3",
	"oas": "application/vnd.fujitsu.oasys",
	"obd": "application/x-msbinder",
	"oda": "application/oda",
	"odb": "application/vnd.oasis.opendocument.database",
	"odc": "application/vnd.oasis.opendocument.chart",
	"odf": "application/vnd.oasis.opendocument.formula",
	"odft": "application/vnd.oasis.opendocument.formula-template",
	"odg": "application/vnd.oasis.opendocument.graphics",
	"odi": "application/vnd.oasis.opendocument.image",
	"odm": "application/vnd.oasis.opendocument.text-master",
	"odp": "application/vnd.oasis.opendocument.presentation",
	"ods": "application/vnd.oasis.opendocument.spreadsheet",
	"odt": "application/vnd.oasis.opendocument.text",
	"oga": "audio/ogg",
	"ogv": "video/ogg",
	"ogx": "application/ogg",
	"onetoc": "application/onenote",
	"opf": "application/oebps-package+xml",
	"opus": "audio/ogg",
	"org": "application/vnd.lotus-organizer",
	"osf": "application/vnd.yamaha.openscoreformat",
	"osfpvg": "application/vnd.yamaha.openscoreformat.osfpvg+xml",
	"otc": "application/vnd.oasis.opendocument.chart-template",
	"otf": "font/otf",
	"otg": "application/vnd.oasis.opendocument.graphics-template",
	"oth": "application/vnd.oasis.opendocument.text-web",
	"oti": "application/vnd.oasis.opendocument.image-template",
	"otp": "application/vnd.oasis.opendocument.presentation-template",
	"ots": "application/vnd.oasis.opendocument.spreadsheet-template",
	"ott": "application/vnd.oasis.opendocument.text-template",
	"oxt": "application/vnd.openofficeorg.extension",
	"p": "text/x-pascal",
	"p10": "application/pkcs10",
	"p12": "application/x-pkcs12",
	"p7b": "application/x-pkcs7-certificates",
	"p7m": "application/pkcs7-mime",
	"p7r": "application/x-pkcs7-certreqresp",
	"p7s": "application/pkcs7-signature",
	"p8": "application/pkcs8",
	"par": "text/plain-bas",
	"paw": "application/vnd.pawaafile",
	"pbd": "application/vnd.powerbuilder6",
	"pbm": "image/x-portable-bitmap",
	"pcf": "application/x-font-pcf",
	"pcl": "application/vnd.hp-pcl",
	"pclxl": "application/vnd.hp-pclxl",
	"pcurl": "application/vnd.curl.pcurl",
	"pcx": "image/x-pcx",
	"pdb": "application/vnd.palm",
	"pdf": "application/pdf",
	"pfa": "application/x-font-type1",
	"pfr": "application/font-tdpfr",
	"pgm": "image/x-portable-graymap",
	"pgn": "application/x-chess-pgn",
	"pgp": "application/pgp-signature",
	"pic": "image/x-pict",
	"pjpeg": "image/pjpeg",
	"pki": "application/pkixcmp",
	"pkipath": "application/pkix-pkipath",
	"plb": "application/vnd.3gpp.pic-bw-large",
	"plc": "application/vnd.mobius.plc",
	"plf": "application/vnd.pocketlearn",
	"pls": "application/pls+xml",
	"pml": "application/vnd.ctc-posml",
	"png": "image/png",
	"pnm": "image/x-portable-anymap",
	"portpkg": "application/vnd.macports.portpkg",
	"potm": "application/vnd.ms-powerpoint.template.macroenabled.12",
	"potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
	"ppam": "application/vnd.ms-powerpoint.addin.macroenabled.12",
	"ppd": "application/vnd.cups-ppd",
	"ppm": "image/x-portable-pixmap",
	"ppsm": "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
	"ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
	"ppt": "application/vnd.ms-powerpoint",
	"pptm": "application/vnd.ms-powerpoint.presentation.macroenabled.12",
	"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"prc": "application/x-mobipocket-ebook",
	"pre": "application/vnd.lotus-freelance",
	"prf": "application/pics-rules",
	"psb": "application/vnd.3gpp.pic-bw-small",
	"psd": "image/vnd.adobe.photoshop",
	"psf": "application/x-font-linux-psf",
	"pskcxml": "application/pskc+xml",
	"ptid": "application/vnd.pvi.ptid1",
	"pub": "application/x-mspublisher",
	"pvb": "application/vnd.3gpp.pic-bw-var",
	"pwn": "application/vnd.3m.post-it-notes",
	"pya": "audio/vnd.ms-playready.media.pya",
	"pyv": "video/vnd.ms-playready.media.pyv",
	"qam": "application/vnd.epson.quickanime",
	"qbo": "application/vnd.intu.qbo",
	"qfx": "application/vnd.intu.qfx",
	"qps": "application/vnd.publishare-delta-tree",
	"qt": "video/quicktime",
	"qxd": "application/vnd.quark.quarkxpress",
	"ra": "audio/vnd.rn-realaudio",
	"ram": "audio/vnd.rn-realaudio",
	"rar": "application/x-rar-compressed",
	"ras": "image/x-cmu-raster",
	"rcprofile": "application/vnd.ipunplugged.rcprofile",
	"rdf": "application/rdf+xml",
	"rdz": "application/vnd.data-vision.rdz",
	"rep": "application/vnd.businessobjects",
	"res": "application/x-dtbresource+xml",
	"rgb": "image/x-rgb",
	"rif": "application/reginfo+xml",
	"rip": "audio/vnd.rip",
	"rl": "application/resource-lists+xml",
	"rlc": "image/vnd.fujixerox.edmics-rlc",
	"rld": "application/resource-lists-diff+xml",
	"rm": "application/vnd.rn-realmedia",
	"rmi": "audio/mid",
	"rmp": "audio/x-pn-realaudio-plugin",
	"rms": "application/vnd.jcp.javame.midlet-rms",
	"rnc": "application/relax-ng-compact-syntax",
	"rp9": "application/vnd.cloanto.rp9",
	"rpss": "application/vnd.nokia.radio-presets",
	"rpst": "application/vnd.nokia.radio-preset",
	"rq": "application/sparql-query",
	"rs": "application/rls-services+xml",
	"rsd": "application/rsd+xml",
	"rss": "application/rss+xml",
	"rtf": "application/rtf",
	"rtx": "text/richtext",
	"s": "text/x-asm",
	"saf": "application/vnd.yamaha.smaf-audio",
	"sbml": "application/sbml+xml",
	"sc": "application/vnd.ibm.secure-container",
	"scd": "application/x-msschedule",
	"scm": "application/vnd.lotus-screencam",
	"scq": "application/scvp-cv-request",
	"scs": "application/scvp-cv-response",
	"scurl": "text/vnd.curl.scurl",
	"sda": "application/vnd.stardivision.draw",
	"sdc": "application/vnd.stardivision.calc",
	"sdd": "application/vnd.stardivision.impress",
	"sdkm": "application/vnd.solent.sdkm+xml",
	"sdp": "application/sdp",
	"sdw": "application/vnd.stardivision.writer",
	"see": "application/vnd.seemail",
	"seed": "application/vnd.fdsn.seed",
	"sema": "application/vnd.sema",
	"semd": "application/vnd.semd",
	"semf": "application/vnd.semf",
	"ser": "application/java-serialized-object",
	"setpay": "application/set-payment-initiation",
	"setreg": "application/set-registration-initiation",
	"sfd-hdstx": "application/vnd.hydrostatix.sof-data",
	"sfs": "application/vnd.spotfire.sfs",
	"sgl": "application/vnd.stardivision.writer-global",
	"sgml": "text/sgml",
	"sh": "application/x-sh",
	"shar": "application/x-shar",
	"shf": "application/shf+xml",
	"sis": "application/vnd.symbian.install",
	"sit": "application/x-stuffit",
	"sitx": "application/x-stuffitx",
	"skp": "application/vnd.koan",
	"sldm": "application/vnd.ms-powerpoint.slide.macroenabled.12",
	"sldx": "application/vnd.openxmlformats-officedocument.presentationml.slide",
	"slt": "application/vnd.epson.salt",
	"sm": "application/vnd.stepmania.stepchart",
	"smf": "application/vnd.stardivision.math",
	"smi": "application/smil+xml",
	"snd": "audio/basic",
	"snf": "application/x-font-snf",
	"spf": "application/vnd.yamaha.smaf-phrase",
	"spl": "application/x-futuresplash",
	"spot": "text/vnd.in3d.spot",
	"spp": "application/scvp-vp-response",
	"spq": "application/scvp-vp-request",
	"src": "application/x-wais-source",
	"sru": "application/sru+xml",
	"srx": "application/sparql-results+xml",
	"sse": "application/vnd.kodak-descriptor",
	"ssf": "application/vnd.epson.ssf",
	"ssml": "application/ssml+xml",
	"st": "application/vnd.sailingtracker.track",
	"stc": "application/vnd.sun.xml.calc.template",
	"std": "application/vnd.sun.xml.draw.template",
	"stf": "application/vnd.wt.stf",
	"sti": "application/vnd.sun.xml.impress.template",
	"stk": "application/hyperstudio",
	"stl": "application/vnd.ms-pki.stl",
	"str": "application/vnd.pg.format",
	"stw": "application/vnd.sun.xml.writer.template",
	"sub": "image/vnd.dvb.subtitle",
	"sus": "application/vnd.sus-calendar",
	"sv4cpio": "application/x-sv4cpio",
	"sv4crc": "application/x-sv4crc",
	"svc": "application/vnd.dvb.service",
	"svd": "application/vnd.svd",
	"svg": "image/svg+xml",
	"swf": "application/x-shockwave-flash",
	"swi": "application/vnd.aristanetworks.swi",
	"sxc": "application/vnd.sun.xml.calc",
	"sxd": "application/vnd.sun.xml.draw",
	"sxg": "application/vnd.sun.xml.writer.global",
	"sxi": "application/vnd.sun.xml.impress",
	"sxm": "application/vnd.sun.xml.math",
	"sxw": "application/vnd.sun.xml.writer",
	"t": "text/troff",
	"tao": "application/vnd.tao.intent-module-archive",
	"tar": "application/x-tar",
	"tcap": "application/vnd.3gpp2.tcap",
	"tcl": "application/x-tcl",
	"teacher": "application/vnd.smart.teacher",
	"tei": "application/tei+xml",
	"tex": "application/x-tex",
	"texinfo": "application/x-texinfo",
	"tfi": "application/thraud+xml",
	"tfm": "application/x-tex-tfm",
	"thmx": "application/vnd.ms-officetheme",
	"tif": "image/tiff",
	"tiff": "image/tiff",
	"tmo": "application/vnd.tmobile-livetv",
	"torrent": "application/x-bittorrent",
	"tpl": "application/vnd.groove-tool-template",
	"tpt": "application/vnd.trid.tpt",
	"tra": "application/vnd.trueapp",
	"trm": "application/x-msterminal",
	"ts": "video/mp2t",
	"tsd": "application/timestamped-data",
	"tsv": "text/tab-separated-values",
	"ttf": "font/ttf",
	"ttl": "text/turtle",
	"twd": "application/vnd.simtech-mindmapper",
	"txd": "application/vnd.genomatix.tuxedo",
	"txf": "application/vnd.mobius.txf",
	"txt": "text/plain",
	"ufd": "application/vnd.ufdl",
	"umj": "application/vnd.umajin",
	"unityweb": "application/vnd.unity",
	"uoml": "application/vnd.uoml+xml",
	"uri": "text/uri-list",
	"ustar": "application/x-ustar",
	"utz": "application/vnd.uiq.theme",
	"uu": "text/x-uuencode",
	"uva": "audio/vnd.dece.audio",
	"uvh": "video/vnd.dece.hd",
	"uvi": "image/vnd.dece.graphic",
	"uvm": "video/vnd.dece.mobile",
	"uvp": "video/vnd.dece.pd",
	"uvs": "video/vnd.dece.sd",
	"uvu": "video/vnd.uvvu.mp4",
	"uvv": "video/vnd.dece.video",
	"vcd": "application/x-cdlink",
	"vcf": "text/x-vcard",
	"vcg": "application/vnd.groove-vcard",
	"vcs": "text/x-vcalendar",
	"vcx": "application/vnd.vcx",
	"vis": "application/vnd.visionary",
	"viv": "video/vnd.vivo",
	"vsd": "application/vnd.visio",
	"vsdx": "application/vnd.visio2013",
	"vsf": "application/vnd.vsf",
	"vtu": "model/vnd.vtu",
	"vxml": "application/voicexml+xml",
	"wad": "application/x-doom",
	"wav": "audio/wav",
	"wax": "audio/x-ms-wax",
	"wbmp": "image/vnd.wap.wbmp",
	"wbs": "application/vnd.criticaltools.wbs+xml",
	"wbxml": "application/vnd.wap.wbxml",
	"weba": "audio/webm",
	"webm": "video/webm",
	"webp": "image/webp",
	"wg": "application/vnd.pmi.widget",
	"wgt": "application/widget",
	"wm": "video/x-ms-wm",
	"wma": "audio/x-ms-wma",
	"wmd": "application/x-ms-wmd",
	"wmf": "application/x-msmetafile",
	"wml": "text/vnd.wap.wml",
	"wmlc": "application/vnd.wap.wmlc",
	"wmls": "text/vnd.wap.wmlscript",
	"wmlsc": "application/vnd.wap.wmlscriptc",
	"wmv": "video/x-ms-wmv",
	"wmx": "video/x-ms-wmx",
	"wmz": "application/x-ms-wmz",
	"woff": "font/woff",
	"woff2": "font/woff2",
	"wpd": "application/vnd.wordperfect",
	"wpl": "application/vnd.ms-wpl",
	"wps": "application/vnd.ms-works",
	"wqd": "application/vnd.wqd",
	"wri": "application/x-mswrite",
	"wrl": "model/vrml",
	"wsdl": "application/wsdl+xml",
	"wspolicy": "application/wspolicy+xml",
	"wtb": "application/vnd.webturbo",
	"wvx": "video/x-ms-wvx",
	"x3d": "application/vnd.hzn-3d-crossword",
	"xap": "application/x-silverlight-app",
	"xar": "application/vnd.xara",
	"xbap": "application/x-ms-xbap",
	"xbd": "application/vnd.fujixerox.docuworks.binder",
	"xbm": "image/x-xbitmap",
	"xdf": "application/xcap-diff+xml",
	"xdm": "application/vnd.syncml.dm+xml",
	"xdp": "application/vnd.adobe.xdp+xml",
	"xdssc": "application/dssc+xml",
	"xdw": "application/vnd.fujixerox.docuworks",
	"xenc": "application/xenc+xml",
	"xer": "application/patch-ops-error+xml",
	"xfdf": "application/vnd.adobe.xfdf",
	"xfdl": "application/vnd.xfdl",
	"xhtml": "application/xhtml+xml",
	"xif": "image/vnd.xiff",
	"xlam": "application/vnd.ms-excel.addin.macroenabled.12",
	"xls": "application/vnd.ms-excel",
	"xlsb": "application/vnd.ms-excel.sheet.binary.macroenabled.12",
	"xlsm": "application/vnd.ms-excel.sheet.macroenabled.12",
	"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"xltm": "application/vnd.ms-excel.template.macroenabled.12",
	"xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
	"xml": "application/rss+xml",
	"xo": "application/vnd.olpc-sugar",
	"xop": "application/xop+xml",
	"xpi": "application/x-xpinstall",
	"xpm": "image/x-xpixmap",
	"xpr": "application/vnd.is-xpr",
	"xps": "application/vnd.ms-xpsdocument",
	"xpw": "application/vnd.intercon.formnet",
	"xslt": "application/xslt+xml",
	"xsm": "application/vnd.syncml+xml",
	"xspf": "application/xspf+xml",
	"xul": "application/vnd.mozilla.xul+xml",
	"xwd": "image/x-xwindowdump",
	"xyz": "chemical/x-xyz",
	"yaml": "text/yaml",
	"yang": "application/yang",
	"yin": "application/yin+xml",
	"zaz": "application/vnd.zzazz.deck+xml",
	"zip": "application/zip",
	"zir": "application/vnd.zul",
	"zmm": "application/vnd.handheld-entertainment+xml",
};

export function getServerFsPromiseModule() {
	return currentFsPromiseModule;
}

export function setServerFsPromiseModule(fsPromiseModule) {
	currentFsPromiseModule = fsPromiseModule;
	clearStaticCache();
}

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

	getExtension() {
		return this.#fileName?.toLowerCase().split('.').at(-1) ?? '';
	}

	getContentTypeByExtension() {
		return mimeTypes[this.getExtension()] ?? 'application/octet-stream';
	}

	getFileName() {
		return this.#fileName;
	}

	toJSON() {
		return {
			content: this.#content,
			contentType: this.#contentType,
			fileName: this.#fileName,
		};
	}
}

export class Request {
	#method;
	#headers = {};
	#path;
	#queryParams = {};
	#pathParams = {};

	#rawBodyPromise;
	#bodyPromise;
	#allParams;
	#cookies;

	#request;
	#customData = null;
	#webSocketData = null;
	#isWebSocketClosed = false;

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

	getPort() {
		return this.#request.socket.address().port;
	}

	getProtocol() {
		const socket = this.#request.socket;

		if (socket instanceof tls.TLSSocket && socket.encrypted) {
			return 'https';
		}

		return 'http';
	}

	getHost() {
		return this.#request.headers.host;
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

	getRawUrl() {
		return this.#request.url;
	}

	getRawBody() {
		if (this.#webSocketData) {
			return Buffer.from([]);
		}

		if (!this.#rawBodyPromise) {
			this.#rawBodyPromise = new Promise((resolve, reject) => {
				const body = [];

				this.#request.on('data', (chunk) => {
					try {
						body.push(chunk);
					} catch (error) {
						reject(error);
					}
				}).on('end', () => {
					try {
						resolve(Buffer.concat(body));
					} catch (error) {
						reject(error);
					}
				}).on('timeout', (error) => {
					reject(error);
				}).on('error', (error) => {
					reject(error);
				});
			});
		}

		return this.#rawBodyPromise;
	}

	getBody() {
		if (this.#webSocketData) {
			return {};
		}

		if (!this.#bodyPromise) {
			this.#bodyPromise = new Promise((resolve, reject) => {
				const maxJsonSize = 32 * 1024 * 1024;
				const maxUrlSize = 1024 * 1024;

				const contentType = this.#headers['content-type'] ?? '';

				if (this.#method === 'GET' && !contentType.includes('application/x-www-form-urlencoded')) {
					resolve(this.#normalizeFormFields(this.#queryParams));
				}

				this.getRawBody().then(async body => {
					if (contentType.includes('application/x-www-form-urlencoded')) {
						try {
							if (body.length > maxUrlSize) {
								throw new Error(`The URL request size (${body.length} bytes) exceeds ${maxUrlSize} bytes`);
							}

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
							if (body.length > maxJsonSize) {
								throw new Error(`The JSON request size (${body.length} bytes) exceeds ${maxJsonSize} bytes`);
							}

							resolve(JSON.parse(body.toString()));
						} catch (error) {
							reject(error);
						}
					} else {
						resolve({ body });
					}
				}).catch(error => {
					reject(error);
				});
			});
		}

		return this.#bodyPromise;
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

	toJSON() {
		return {
			method: this.#method,
			headers: this.#headers,
			path: this.#path,
			queryParams: this.#queryParams,
		};
	}

	isHandledAsWebSocket() {
		return !!this.#webSocketData;
	}

	handleAsWebSocket(callback) {
		if (typeof callback === 'function') {
			try {
				this.#initWebSocket();
			} catch (error) {
				this.#closeWebSocket(true);
				throw error;
			}
		} else {
			throw new Error('Callback not provided');
		}

		const firstTime = this.#webSocketData.listeners.size === 0;

		this.#webSocketData.listeners.add(callback);

		if (firstTime) {
			this.#handleWebSocketRequests();
		}

		return {
			write: this.#webSocketData.write,
			close: this.#webSocketData.close,
		};
	}

	waitForWebSocketToClose() {
		if (!this.#webSocketData || this.#isWebSocketClosed) {
			return;
		}

		return new Promise(resolve => {
			const socket = this.#request.socket;

			socket.on("close", () => {
				resolve();
			});

			socket.on("end", () => {
				resolve();
			});

			socket.on("error", (error) => {
				resolve();
			});

			socket.on('timeout', (error) => {
				resolve();
			});
		})
	}

	async #readBytesFromWebSocket(size = 1) {
		let result = Buffer.alloc(0);

		do {
			if (this.#isWebSocketClosed) {
				throw new Error('Socket is closed');
			}

			this.#webSocketData.nextDataPromiseWithResolvers = null;
			result = Buffer.concat([result, ...this.#webSocketData.collectedData]);
			this.#webSocketData.collectedData = [];

			if (result.length === size) {
				return result;
			}

			if (result.length > size) {
				this.#webSocketData.collectedData = [result.subarray(size)];
				return result.subarray(0, size);
			}

			this.#webSocketData.nextDataPromiseWithResolvers = Promise.withResolvers();
			await this.#webSocketData.nextDataPromiseWithResolvers.promise;
		} while (true);
	}

	#initWebSocket() {
		if (this.#isWebSocketClosed) {
			throw new Error('Socket is already closed');
		}

		if (this.#webSocketData) {
			return;
		}

		const webSocketHeader = this.#headers["sec-websocket-key"];

		if (!webSocketHeader) {
			throw new JsonResponse({
				message: 'Header "sec-websocket-key" is missing',
			}, 400);
		}

		const socket = this.#request.socket;

		this.#webSocketData = {
			write: (data) => this.#writeIntoWebSocket(data),
			close: () => {
				this.#webSocketData.isManuallyClosed = true;
				this.#closeWebSocket()
			},
			listeners: new Set(),
			nextDataPromiseWithResolvers: null,
			isManuallyClosed: false,
			collectedData: [],
		};

		const guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
		const sha1 = nodeCrypto.createHash("sha1");
		sha1.update(webSocketHeader + guid);
		const validHandShakeKey = sha1.digest("base64");

		const responseHeaders = [
			"HTTP/1.1 101 Web Socket Protocols",
			"Upgrade: WebSocket",
			"Connection: Upgrade",
			`Sec-WebSocket-Accept: ${validHandShakeKey}`,
			"\r\n",
		].join("\r\n");

		socket.write(responseHeaders);

		socket.on("data", (data) => {
			this.#webSocketData.collectedData.push(data);
			this.#webSocketData.nextDataPromiseWithResolvers?.resolve();
			this.#webSocketData.nextDataPromiseWithResolvers = null;
		});

		socket.on("close", () => {
			this.#closeWebSocket();
		});


		socket.on("end", () => {
			this.#closeWebSocket();
		});

		socket.on("error", (error) => {
			this.#webSocketData.nextDataPromiseWithResolvers?.reject(error);
			this.#webSocketData.nextDataPromiseWithResolvers = null;
			this.#closeWebSocket(true);
		});

		socket.on('timeout', (error) => {
			this.#webSocketData.nextDataPromiseWithResolvers?.reject(error);
			this.#webSocketData.nextDataPromiseWithResolvers = null;
			this.#closeWebSocket(true);
		});
	}

	async #handleWebSocketRequests() {
		const maxPayloadSize = 16 * 1024 * 1024;

		const sendDataToAllListeners = async (data = null, type = 'start') => {
			const statuses = await Promise.allSettled(this.#webSocketData.listeners.values().map(listener => listener(data, type)));

			for (const status of statuses) {
				if (status.status === 'rejected') {
					safePrint(status.reason);
				}
			}
		};

		try {
			let collectedPayload = [];

			await new Promise((resolve) => setTimeout(resolve));
			await sendDataToAllListeners();

			do {
				if (this.#isWebSocketClosed) {
					await sendDataToAllListeners(null, 'end');
					return;
				}

				const head = await this.#readBytesFromWebSocket(2);
				const opCode = head[0] & 0b00001111;

				if (opCode === 0b00001000) {
					await sendDataToAllListeners(null, 'end');
					this.#closeWebSocket();
					return;
				}

				const fin = !!(head[0] & 0b10000000);
				const hasMask = !!(head[1] & 0b10000000);
				let payloadLength = head[1] & 0b01111111;

				if (payloadLength === 126) {
					const payloadBytes = await this.#readBytesFromWebSocket(2);
					payloadLength = 0;

					for (let i = 0; i < 2; ++i) {
						payloadLength += payloadBytes[1 - i] << (8 * i);
					}
				} else if (payloadLength === 127) {
					const payloadBytes = await this.#readBytesFromWebSocket(8);
					payloadLength = 0;

					for (let i = 0; i < 8; ++i) {
						payloadLength += payloadBytes[7 - i] << (8 * i);
					}
				}

				if (payloadLength > maxPayloadSize) {
					throw new Error(`Payload size (${payloadLength} bytes) exceeds ${maxPayloadSize} bytes`);
				}

				const mask = hasMask ? (await this.#readBytesFromWebSocket(4)) : Buffer.alloc(4);
				const payload = await this.#readBytesFromWebSocket(payloadLength);

				for (let i = 0; i < payloadLength; ++i) {
					payload[i] ^= mask[i & 0b11];
				}

				collectedPayload.push(payload);

				if (fin) {
					const finalBuffer = Buffer.concat(collectedPayload);
					collectedPayload = [];

					switch (opCode) {
						case 0b00000001:
						case 0b00000010:
							await sendDataToAllListeners(opCode === 0b00000001 ? finalBuffer.toString('utf8') : finalBuffer, 'message');
							break;
						case 0b00001001:
							this.#writeIntoWebSocket(finalBuffer, true);
							break;
						default:
							throw new Error(`Invalid op code ${opCode}`);
					}
				}
			} while (true);
		} catch (error) {
			safePrint(error, true);
			this.#closeWebSocket(true);

			if (this.#webSocketData.isManuallyClosed) {
				await sendDataToAllListeners(null, 'end');
			} else {
				await sendDataToAllListeners(error, 'erorr');
			}
		}
	}

	#writeIntoWebSocket(data, isPong = false) {
		if (this.#isWebSocketClosed || !this.#webSocketData) {
			return;
		}

		if (ArrayBuffer.isView(data) && !(data instanceof Buffer)) {
			data = data.buffer;
		}

		if (typeof data !== 'string' && !(data instanceof Array || data instanceof Buffer || data instanceof ArrayBuffer)) {
			data = `${data}`;
		}

		const isString = typeof data === 'string';
		const buffer = data instanceof Buffer ? data : (isString ? Buffer.from(data, 'utf-8') : Buffer.from(data));
		const length = buffer.length;

		let payloadLength = [length];

		if (length > 65535) {
			payloadLength[0] = 127;

			for (let i = 7; i >= 0; --i) {
				payloadLength.push((length >> (i * 8)) & 0b11111111);
			}
		} else if (length > 125) {
			payloadLength[0] = 126;

			for (let i = 1; i >= 0; --i) {
				payloadLength.push((length >> (i * 8)) & 0b11111111);
			}
		}

		const opCodeWithFin = Buffer.from([isPong ? 0b10001010 : (isString ? 0b10000001 : 0b10000010)]);
		payloadLength = Buffer.from(payloadLength);

		this.#request.socket.write(opCodeWithFin);
		this.#request.socket.write(payloadLength);
		this.#request.socket.write(buffer);
	}

	#closeWebSocket(error = false) {
		if (this.#isWebSocketClosed || !this.#webSocketData) {
			return;
		}

		this.#isWebSocketClosed = true;
		const socket = this.#request.socket;
		this.#webSocketData.nextDataPromiseWithResolvers?.reject(new Error('Socket is closed'));
		this.#webSocketData.nextDataPromiseWithResolvers = null;
		socket.end(Buffer.from(error ? [] : [0b10001000, 0b00000000]));
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
	#maxFragmentSize = 16 * 1024 * 1024 * 1024;
	#fragmentRequestMap = new WeakMap();
	#makeNotFoundResponse = null;
	#urlPathForDirectory = null;

	#blocked = false;

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
				'Accept-Ranges': 'bytes',
				'Content-Range': `bytes ${requestedFragment.offset}-${requestedFragment.offset + requestedFragment.size - 1}/${data.size}`,
				'Content-Length': `${requestedFragment.size}`,
				'Cache-Control': 'no-store, no-cache, must-revalidate',
			};
		}

		if (typeof data.body === 'function') {
			return {
				...data.headers,
				'Cache-Control': 'no-store, no-cache, must-revalidate',
			}
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

	setNotFoundErrorCustomResponseHandler(handler) {
		this.#makeNotFoundResponse = handler;
		this.#dataPromise = null;
	}

	setUrlPathForDirectory(urlPathForDirectory) {
		this.#urlPathForDirectory = urlPathForDirectory;
		this.#dataPromise = null;
	}

	#isStreamableFileFormat(isDirectory = false) {
		if (isDirectory) {
			return false;
		}

		const extension = this.#filePath?.toLowerCase().split('.').at(-1) ?? '';
		return !!mimeTypes[extension]?.match(/^(audio|video)\//);
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

			let size = (numbers[1] ?? (this.#maxFragmentSize - 1 + offset)) - offset + 1;

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

	async * #getDirectoryStream() {
		const data = await this.#retreiveData();

		if (typeof data.body !== 'function') {
			yield data.body;
			return;
		}

		const urlPath = this.#urlPathForDirectory;
		const parentUrlPath = urlPath.split('/').filter((x, i, arr) => x && i !== arr.length - 1).join('/');
		const filePath = this.#filePath;

		yield `<!DOCTYPE html>
<html lang="en">
<head>
<title>${escapeHtml(urlPath)}</title>
</head>
<body>
${urlPath ? `<a href="/${parentUrlPath}">Up</a><hr>` : ''}
`;

		const files = await currentFsPromiseModule.readdir(filePath);
		let counter = 0;

		for (const file of files) {
			if (this.#blocked) {
				break;
			}

			if (counter === 100) {
				await new Promise(resolve => setTimeout(resolve, 50));
			}

			++counter;

			yield `<a href="/${urlPath}/${encodeURIComponent(file)}">${escapeHtml(file)}</a><br>`;
		}


		yield `</body>`

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
			const maxChunkSize = fragmentRequest ? 256 * 1024 : this.#maxChunkSize;

			filehandle = await currentFsPromiseModule.open(this.#filePath, 'r');

			for (let offset = 0; offset < requestedSize && !this.#blocked; offset += maxChunkSize) {
				const size = Math.min(maxChunkSize, requestedSize - offset);
				const chunk = await filehandle.read(Buffer.alloc(size), 0, size, offset + requestedPosition);
				yield chunk.buffer;
			}
		} finally {
			filehandle?.close();
		}
	}

	#retreiveData() {
		if (!this.#dataPromise) {
			this.#dataPromise = new Promise(async resolve => {
				let filehandle;

				try {
					if (this.#blocked) {
						throw new Error(`${this.#filePath} is blocked`);
					}

					filehandle = await currentFsPromiseModule.open(this.#filePath, 'r');
					const stat = await filehandle.stat();
					const size = stat.size;
					const readAsDirectory = stat.isDirectory() && this.#urlPathForDirectory !== null;
					const body = size > this.#maxChunkSize || this.#isStreamableFileFormat(readAsDirectory) ? (fragmentRequest => this.#getBodyStream(fragmentRequest)) : (readAsDirectory ? (() => this.#getDirectoryStream()) : await filehandle.readFile());

					resolve({
						code: this.#code,
						headers: this.getMergedWithOtherHeaders({
							'Content-Type': this.#contentType ??
								(readAsDirectory ? 'text/html; charset=utf-8' : null) ??
								mimeTypes[this.#filePath.split('.').at(-1).toLowerCase()] ??
								'application/octet-stream',
							'Content-Length': readAsDirectory ? null : size,
						}
						),
						body,
						size,
					});
				} catch (e) {
					safePrint(e, true);

					const notFountData = {
						code: 404,
						headers: this.getMergedWithOtherHeaders({ 'Content-Type': 'application/json' }),
						body: JSON.stringify({
							message: `File not found`
						})
					};

					try {
						const response = await this.#makeNotFoundResponse?.(this.#filePath);

						if (response instanceof Response) {
							const code = await response.getCode();
							const headers = await response.getHeaders();
							const body = await response.getBody();

							notFountData.code = code;
							notFountData.headers = headers;
							notFountData.body = body;
						}
					} catch (error) {
						safePrint(error, true);
					}

					resolve(notFountData);
				} finally {
					await filehandle?.close();
				}
			});
		}

		return this.#dataPromise;
	}

	block() {
		this.#blocked = true;
		this.#dataPromise = null;
	}

	isBlocked() {
		return this.#blocked;
	}
}

export class JsonResponse extends Response {
	#object;
	#code;
	#cachedBuffer = null;

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
		return this.getMergedWithOtherHeaders({
			'Content-Type': 'application/json',
			'Content-Length': `${this.getBody().length}`,
		});
	}

	getBody() {
		if (!this.#cachedBuffer) {
			this.#cachedBuffer = Buffer.from(JSON.stringify(this.#object), 'utf8');
		}

		return this.#cachedBuffer;
	}

	getObject() {
		return this.#object;
	}

	setObject(object) {
		this.#cachedBuffer = null;
		this.#object = object;
	}
}

export class HTMLResponse extends Response {
	#string;
	#code;
	#cachedBuffer = null;

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
		return this.getMergedWithOtherHeaders({
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Length': `${this.getBody().length}`,
		});
	}

	getBody() {
		if (!this.#cachedBuffer) {
			this.#cachedBuffer = Buffer.from(this.#string, 'utf8');
		}

		return this.#cachedBuffer;
	}

	getString() {
		return this.#string;
	}

	setString(string) {
		this.#cachedBuffer = null;
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

export function serve(routes, port = 80, staticFileDirectoryOrDirectories = null, handleNotFoundError = null, handleServerError = null) {
	port = +port;
	routes = normalizeRoutes(routes, handleServerError);
	staticFileDirectoryOrDirectories = normalizeStaticFileDirectories(staticFileDirectoryOrDirectories);
	safePrint(routes);
	safePrint(staticFileDirectoryOrDirectories);

	try {
		unserve(port);


		const callback = async (req, res) => {
			try {
				const [code, headers, body, isHandledAsWebSocket] = await handleRequest(req, routes, staticFileDirectoryOrDirectories, handleNotFoundError);

				if (isHandledAsWebSocket || !(res instanceof http.ServerResponse)) {
					return;
				}

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
				safePrint(error, true);
			} finally {
				res.end();
			}
		};

		const server = http.createServer(callback);
		server.on('upgrade', callback);

		servers.set(port, server);

		server.keepAliveTimeout = keepAliveTimeout;
		server.headersTimeout = keepAliveTimeout;

		server.on('error', (error) => {
			unserve(port);
			safePrint(error, true);
		});

		server.listen(port, () => {
			safePrint(`Server started on port ${port}`);
		});
	} catch (e) {
		safePrint(e, true);
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
		safePrint(`Server closed on port ${port}`);
	});

	servers.delete(port);
}

function normalizeStaticFileDirectories(staticFileDirectoryOrDirectories) {
	if (staticFileDirectoryOrDirectories !== null && staticFileDirectoryOrDirectories !== undefined) {
		if (!Array.isArray(staticFileDirectoryOrDirectories)) {
			staticFileDirectoryOrDirectories = [staticFileDirectoryOrDirectories];
		}

		staticFileDirectoryOrDirectories = staticFileDirectoryOrDirectories.filter(x => x !== null && typeof x === 'object' || typeof x === 'string').map(x => {
			let serverFilePath = '', urlPath = '', showWholeDirectory = false;;

			if (typeof x === 'string') {
				serverFilePath = urlPath = x;
				showWholeDirectory = false;
			} else {
				({ serverFilePath, urlPath, showWholeDirectory } = x);
			}

			urlPath = `${urlPath}`.split('/').filter(x => x).join('/');
			serverFilePath = `${serverFilePath}`.split('/').filter(x => x).join('/');
			showWholeDirectory = !!showWholeDirectory;

			return {
				urlPath,
				serverFilePath,
				showWholeDirectory,
			};
		});
	} else {
		staticFileDirectoryOrDirectories = [];
	}

	return staticFileDirectoryOrDirectories;
}

function normalizeRoutes(routes, handleServerError) {
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

			if (handleServerError) {
				const callback = flatten[path];

				flatten[path] = async (request, handleOptions = false) => {
					try {
						return await callback(request, handleOptions);
					} catch (error) {
						if (error instanceof Response) {
							throw error;
						}

						safePrint(error);
						return wrapInResponseClass(await handleServerError(request, error));
					}
				};
			}
		}
	}

	flattenRecursively(routes);

	const result = {};

	for (const route in flatten) {
		const split = route.split('/').filter(x => x);
		let method = split.at(-1)?.toUpperCase();

		if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(method)) {
			split.pop();
		} else {
			method = 'GET';
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
	invalidateStaticCache(path);
}

export function blockStaticCache(path = null) {
	invalidateStaticCache(path, false);
}

function invalidateStaticCache(path = null, clear = true) {
	if (path === null) {
		for (const v of staticCache.values()) {
			v.block();
		}

		if (clear) {
			staticCache.clear();
		}
	} else {
		path = `${path}`.split('/').filter(x => x).join('/');

		if (!clear && !staticCache.has(path)) {
			staticCache.set(path, new FileResponse(path));
		}

		staticCache.get(path)?.block();

		if (clear) {
			staticCache.delete(path);
		}
	}
}

async function handleRequest(req, routes, staticFileDirectories, handleNotFoundError) {
	let response = new JsonResponse({
		message: 'Invalid data'
	}, 400);

	let requestHeaders;
	let responseBodyIsIncluded = true;

	try {
		const request = new Request(req);

		const method = request.getMethod();
		const path = request.getPath();
		const pathParams = {};
		requestHeaders = request.getHeaders();
		responseBodyIsIncluded = method !== 'HEAD';

		let routeHandler = routes;
		let handleOptions = false;

		const staticFileOrDirectory = method === 'GET' || !responseBodyIsIncluded ? staticFileDirectories.find(x => x.urlPath === path || path.startsWith(x.urlPath + '/')) : null;

		if (staticFileOrDirectory) {
			routeHandler = () => {
				const filePath = decodeURI(path).replace(staticFileOrDirectory.urlPath, staticFileOrDirectory.serverFilePath);

				let resp = staticCache.get(filePath);

				if (!resp) {
					resp = new FileResponse(filePath);
					resp.addCustomHeaders({
						'Cache-Control': 'public, max-age=432000',
					});

					if (handleNotFoundError) {
						resp.setNotFoundErrorCustomResponseHandler(() => handleNotFoundError(request));
					}

					if (staticFileOrDirectory.showWholeDirectory) {
						resp.setUrlPathForDirectory(path);
					}

					staticCache.set(filePath, resp);

					if (staticCache.size > 500) {
						for (const [k, v] of staticCache.entries()) {
							if (!v.isBlocked()) {
								staticCache.delete(k);
								break;
							}
						}
					}
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
			} else if (!responseBodyIsIncluded && typeof routeHandler?.[`/${method}/`] !== 'function') {
				routeHandler = routeHandler?.[`/GET/`];
			} else {
				routeHandler = routeHandler?.[`/${method}/`];
			}
		}

		if (typeof routeHandler === 'function') {
			request.setPathParams(pathParams);
			response = await routeHandler(request, handleOptions);

			if (request.isHandledAsWebSocket()) {
				await request.waitForWebSocketToClose();
				return [null, null, null, true];
			}
		} else {
			response = await handleNotFoundError?.(request);

			if (!(response instanceof Response)) {
				response = new JsonResponse({
					message: `Route ${method} "${path}" not found`
				}, 404);
			}
		}
	} catch (error) {
		if (error instanceof Response) {
			response = error;
		} else {
			safePrint(error, true);

			response = new JsonResponse({
				message: 'Something went wrong'
			}, 500);
		}
	}

	try {
		return await Promise.all([response.getCode(requestHeaders), response.getHeaders(requestHeaders), responseBodyIsIncluded ? response.getBody(requestHeaders) : '', false]);
	} catch (error) {
		safePrint(error, true);

		response = new JsonResponse({
			message: 'Something went wrong'
		}, 500);

		return [response.getCode(), response.getHeaders(), responseBodyIsIncluded ? response.getBody() : '', false];
	}
}