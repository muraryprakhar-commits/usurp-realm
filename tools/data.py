"""Content data for the Crest Studio guide pages. Every Latin motto here is an established
phrase with its standard translation; sources noted where the origin is well known."""

# Tincture hexes match crest-core.js
GULES, MURREY, AZURE, VERT, PURPURE, SABLE, OR, ARGENT = (
    '#b3242f', '#7a1020', '#1f4e8a', '#1f5f3d', '#5a2a6e', '#1d1915', '#d4af5a', '#e8e4d8')
GOLD_LIGHT = '#f3dc92'


def crest(name, motto, f, d, c, div, ch, bg='parch'):
    return dict(name=name, motto=motto, f=f, d=d, c=c, div=div, ch=ch, bg=bg)


THEMES = [
    ('courage', 'Courage'), ('perseverance', 'Perseverance'), ('family', 'Family and unity'),
    ('wisdom', 'Wisdom and truth'), ('ambition', 'Ambition'), ('honor', 'Honor and duty'),
    ('love', 'Love'), ('faith', 'Faith'),
]

# (latin, english, theme, source or '')
MOTTOS = [
    ('Audentes fortuna iuvat', 'Fortune favors the bold', 'courage', 'Virgil, Aeneid'),
    ('Fortes fortuna adiuvat', 'Fortune helps the brave', 'courage', 'Terence'),
    ('Fortuna favet fortibus', 'Fortune favors the brave', 'courage', ''),
    ('Fortis et liber', 'Strong and free', 'courage', ''),
    ('Fortiter et fideliter', 'Bravely and faithfully', 'courage', ''),
    ('Virtute et armis', 'By courage and by arms', 'courage', 'Motto of Mississippi'),
    ('Nec aspera terrent', 'Hardships do not deter us', 'courage', ''),
    ('Nemo me impune lacessit', 'No one provokes me with impunity', 'courage', 'Order of the Thistle'),
    ('Aut viam inveniam aut faciam', 'I will find a way or make one', 'courage', 'Attributed to Hannibal'),
    ('Per aspera ad astra', 'Through hardships to the stars', 'perseverance', ''),
    ('Labor omnia vincit', 'Work conquers all', 'perseverance', 'Virgil, Georgics'),
    ('Nil desperandum', 'Never despair', 'perseverance', 'Horace'),
    ('Dum spiro spero', 'While I breathe, I hope', 'perseverance', 'Motto of South Carolina'),
    ('Vincit qui patitur', 'He who endures conquers', 'perseverance', ''),
    ('Fortitudine vincimus', 'By endurance we conquer', 'perseverance', 'Shackleton family motto'),
    ('Tenax propositi', 'Steadfast of purpose', 'perseverance', 'Horace'),
    ('Gradatim ferociter', 'Step by step, ferociously', 'perseverance', ''),
    ('Post nubila Phoebus', 'After the clouds, the sun', 'perseverance', ''),
    ('Spero meliora', 'I hope for better things', 'perseverance', ''),
    ('Semper fidelis', 'Always faithful', 'family', ''),
    ('Fidelis et constans', 'Faithful and constant', 'family', ''),
    ('Ubi concordia, ibi victoria', 'Where there is unity, there is victory', 'family', ''),
    ('Concordia res parvae crescunt', 'Through harmony small things grow', 'family', 'Sallust'),
    ('Ex unitate vires', 'From unity, strength', 'family', ''),
    ('Non sibi sed omnibus', 'Not for oneself but for all', 'family', ''),
    ('Sapere aude', 'Dare to be wise', 'wisdom', 'Horace'),
    ('Veritas vincit', 'Truth conquers', 'wisdom', ''),
    ('Lux et veritas', 'Light and truth', 'wisdom', ''),
    ('Fiat lux', 'Let there be light', 'wisdom', ''),
    ('Scientia potentia est', 'Knowledge is power', 'wisdom', ''),
    ('Esse quam videri', 'To be, rather than to seem', 'wisdom', 'Motto of North Carolina'),
    ('Facta non verba', 'Deeds, not words', 'wisdom', ''),
    ('Ad astra', 'To the stars', 'ambition', ''),
    ('Ad maiora', 'Toward greater things', 'ambition', ''),
    ('Sic itur ad astra', 'Thus one goes to the stars', 'ambition', 'Virgil, Aeneid'),
    ('Excelsior', 'Ever upward', 'ambition', 'Motto of New York'),
    ('Carpe diem', 'Seize the day', 'ambition', 'Horace'),
    ('Nunc aut numquam', 'Now or never', 'ambition', ''),
    ('Non ducor, duco', 'I am not led, I lead', 'ambition', 'Motto of the city of São Paulo'),
    ('Honor virtutis praemium', 'Honor is the reward of virtue', 'honor', 'Cicero'),
    ('Virtus sola nobilitat', 'Virtue alone ennobles', 'honor', ''),
    ('Virtute et labore', 'By virtue and labor', 'honor', ''),
    ('Semper paratus', 'Always ready', 'honor', 'US Coast Guard'),
    ('In omnia paratus', 'Ready for anything', 'honor', ''),
    ('Fac et spera', 'Do, and hope', 'honor', 'Clan Matheson'),
    ('Omnia vincit amor', 'Love conquers all', 'love', 'Virgil, Eclogues'),
    ('Amor vincit omnia', 'Love conquers all', 'love', ''),
    ('Animo et fide', 'By courage and faith', 'faith', ''),
    ('Fide et fortitudine', 'By faith and fortitude', 'faith', ''),
    ('In Deo speramus', 'In God we hope', 'faith', 'Brown University'),
    ('Spes mea in Deo', 'My hope is in God', 'faith', ''),
    ('Nisi Dominus frustra', 'Without the Lord, in vain', 'faith', 'City of Edinburgh'),
]

# Fantasy house name parts (original, not taken from any published setting)
HOUSE_A = ['Ash', 'Thorn', 'Iron', 'Raven', 'Storm', 'Wolf', 'Oak', 'Silver', 'Grey', 'Stone', 'Frost', 'Hawk',
           'Elder', 'Gold', 'Dusk', 'Ember', 'Bright', 'Cold', 'Fair', 'High', 'Hollow', 'Mist', 'Red', 'Wyn',
           'Bramble', 'Briar', 'Cinder', 'Moon', 'Salt', 'Wren']
HOUSE_B = ['ford', 'wood', 'wall', 'mere', 'vale', 'crest', 'hold', 'wick', 'ridge', 'field', 'moor', 'fell',
           'hart', 'bourne', 'worth', 'shaw', 'combe', 'stead', 'mont', 'gard', 'haven', 'brook', 'ley', 'gate']
HOUSE_MOTTOS = ['The Root Holds', 'Steel Remembers', 'First Light, Last Stand', 'No Storm Unweathered',
                'We Rise Unbidden', 'Ash Feeds the Flame', 'Hold the Gate', 'By Oath and Ember', 'Silent Until Sworn',
                'The Tide Returns', 'Patience Cuts Stone', 'Ever the Vigil', 'Of Iron, Not Gold', 'We Endure',
                'The Crown Is Earned', 'Light in the Long Night', 'Ours the Harvest', 'We Rise by Night',
                'Bend, Never Break', 'Keep the Old Ways', 'Faith Before Fear', 'What We Build, Stands',
                'Watch and Ward', 'Swift and Unseen', 'The Key Turns Once', 'Beyond the Last Hill']
