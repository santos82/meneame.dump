import re

import requests

re_arg = re.compile(r"\$_(?:REQUEST|GET)\[['\"]([^'\"]+)['\"]\]")
re_contenttype = re.compile(r'Content-Type:\s*([^\s;"\']+);')
re_path = re.compile(r"www/.*\.php")


class EndPoint:

    def __init__(self, path):
        self.url = "https://www.meneame.net/" + path
        self.raw = "https://raw.githubusercontent.com/Meneame/meneame.net/master/www/" + \
            path
        self.git = "https://github.com/Meneame/meneame.net/blob/master/www/" + path
        self.net = "https://www.meneame.net/" + path
        self.arg = None
        self.type = None
        self.text = None

    def __str__(self):
        return self.url

    def load(self):
        r = requests.get(self.raw)
        self.text = r.text
        self.arg = sorted(set(re_arg.findall(r.text)))
        self.type = sorted(set(re_contenttype.findall(r.text)))

    @staticmethod
    def search():
        json = requests.get(
            "https://api.github.com/repos/Meneame/meneame.net/git/trees/master?recursive=1").json()

        phps = [j["path"][4:]
                for j in json["tree"] if re_path.match(j["path"])]

        ends = []
        types = []

        for php in phps:
            end = EndPoint(php)
            end.load()
            if len(end.arg) > 0:
                ends.append(end)

        return ends


def ptype(f, ends, t=None):
    if t:
        _ends = [e for e in ends if t in e.type]
    else:
        _ends = [e for e in ends if len(e.type) == 0]
        t = "NO FOUND"
    f.write("# "+t+"\n")
    f.write("\n")
    for e in _ends:
        net = e.net + "?" + "=&".join(e.arg)+"="
        txt = e.net.replace("https://www.", "")
        f.write("\n")
        f.write("[GitHub](%s) [%s](%s)\n" % (e.git, txt, net))
        f.write("\n")
        arg = (("\\"+a) if a.startswith("_") else a for a in e.arg)
        f.write("..... " + ", ".join(arg) + "\n")
        if len(e.type) > 1:
            f.write("..... " + ", ".join(e.type) + "\n")
        f.write("\n")


if __name__ == "__main__":
    from os.path import realpath, dirname
    ends = EndPoint.search()
    types = set()
    for e in ends:
        for t in e.type:
            types.add(t)
    out = realpath(__file__)
    out = dirname(out) + "/README.md"
    with open(out, "w") as f:
        for t in sorted(types):
            ptype(f, ends, t)
        ptype(f, ends)
