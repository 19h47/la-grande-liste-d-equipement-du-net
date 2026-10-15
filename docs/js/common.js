/* Outils partagés par les pages : échappement, recherche sans accents, langue des noms,
   monnaies et copie dans le presse-papiers. */
const GL = (() => {
	const API = 'api/v1/';
	const $ = id => document.getElementById(id);
	const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
	const norm = s => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
	const json = path => fetch(API + path).then(r => { if (!r.ok) throw new Error(path); return r.json(); });

	/* Langue des noms d'objets (l'interface reste en français). */
	let lang = 'fr';
	try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch (e) {}
	const listeners = [];
	function setLang(l) {
		lang = l;
		try { localStorage.setItem('lang', l); } catch (e) {}
		paintLang();
		listeners.forEach(fn => fn(l));
	}
	function paintLang() {
		document.querySelectorAll('[data-lang-btn]').forEach(b => {
			b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang));
		});
	}
	const onLang = fn => listeners.push(fn);
	/* Texte bilingue {fr, en} : la langue choisie, sinon le français. */
	const t = o => o ? (o[lang] ?? o.fr) : '';

	/* Monnaies. Les sommes sont rendues en po, pa et pc, comme à la table. */
	const UNITS = { pc: 1, cp: 1, pa: 10, sp: 10, pe: 50, ep: 50, po: 100, gp: 100, pp: 500 };
	const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	function fmt(cp, l = lang) {
		cp = Math.round(cp);
		if (!cp) return l === 'en' ? '0cp' : '0 pc';
		const steps = l === 'en' ? [['gp', 100], ['sp', 10], ['cp', 1]] : [['po', 100], ['pa', 10], ['pc', 1]];
		const out = [];
		for (const [a, v] of steps) {
			const n = Math.floor(cp / v);
			if (n) { out.push(l === 'en' ? group(n) + a : group(n) + ' ' + a); cp -= n * v; }
		}
		return out.join(' ');
	}
	/* « 10 po », « 2,5 po », « 1 po 5 pa », « 30 » (po par défaut) → pièces de cuivre. */
	function parseMoney(s) {
		const txt = norm(s).replace(/(\d)[\s ](?=\d{3}\b)/g, '$1').replace(/,/g, '.');
		const re = /(\d+(?:\.\d+)?)\s*(pc|pa|pe|po|pp|cp|sp|ep|gp)?/g;
		let total = 0, found = false, m;
		while ((m = re.exec(txt))) { found = true; total += parseFloat(m[1]) * UNITS[m[2] || 'po']; }
		return found ? Math.round(total) : null;
	}

	async function copy(text) {
		try { await navigator.clipboard.writeText(text); return true; } catch (e) {
			const ta = document.createElement('textarea');
			ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
			document.body.appendChild(ta); ta.select();
			let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
			ta.remove(); return ok;
		}
	}
	/* Message bref dans un bouton (« Copié »), puis retour au libellé. */
	function flash(btn, msg) {
		const old = btn.dataset.label || (btn.dataset.label = btn.textContent);
		btn.textContent = msg;
		clearTimeout(btn._t); btn._t = setTimeout(() => { btn.textContent = old; }, 1600);
	}

	/* Ligne à points de conduite pour le texte brut copié. */
	function leaderLine(name, price, width = 64) {
		const room = width - price.length - 2;
		const n = name.length > room - 3 ? name.slice(0, room - 4) + '…' : name;
		return n + ' ' + '.'.repeat(Math.max(3, room - n.length)) + ' ' + price;
	}

	/* Le sac de l'aventurier : une liste [id, quantité] gardée dans le navigateur, et écrite dans
	   l'adresse sous la forme « epee-longue.2~corde-de-chanvre » pour la partager. */
	const bagListeners = [];
	const bagRead = () => {
		try { const b = JSON.parse(localStorage.getItem('sac')); return Array.isArray(b) ? b.filter(x => typeof x[0] === 'string' && x[1] > 0) : []; } catch (e) { return []; }
	};
	function bagWrite(list) {
		try { localStorage.setItem('sac', JSON.stringify(list)); } catch (e) {}
		paintBag(); bagListeners.forEach(fn => fn(list));
	}
	function bagAdd(id, n = 1) {
		const list = bagRead(), x = list.find(y => y[0] === id);
		if (x) x[1] += n; else list.push([id, n]);
		bagWrite(list.filter(y => y[1] > 0));
	}
	const bagQty = id => (bagRead().find(x => x[0] === id) || [, 0])[1];
	const bagEncode = list => list.map(([id, n]) => n > 1 ? id + '.' + n : id).join('~');
	const bagDecode = s => (s || '').split('~').map(p => { const m = /^([a-z0-9-]+)(?:\.(\d+))?$/.exec(p); return m && [m[1], Math.min(+(m[2] || 1), 9999)]; }).filter(Boolean);
	function paintBag() {
		const n = bagRead().reduce((s, x) => s + x[1], 0);
		document.querySelectorAll('[data-bag-count]').forEach(el => { el.textContent = n ? ` (${n})` : ''; });
	}
	/* Un sac modifié dans un autre onglet. */
	window.addEventListener('storage', e => { if (e.key === 'sac') { paintBag(); bagListeners.forEach(fn => fn(bagRead())); } });
	const bag = { read: bagRead, write: bagWrite, add: bagAdd, qty: bagQty, encode: bagEncode, decode: bagDecode, on: fn => bagListeners.push(fn) };

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('[data-lang-btn]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.langBtn)));
		document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
		paintLang(); paintBag();
	});

	return { API, $, esc, norm, json, get lang() { return lang; }, setLang, onLang, t, fmt, parseMoney, group, copy, flash, leaderLine, bag };
})();
