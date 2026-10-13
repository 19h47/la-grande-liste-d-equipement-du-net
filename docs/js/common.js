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

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('[data-lang-btn]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.langBtn)));
		document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
		paintLang();
	});

	return { API, $, esc, norm, json, get lang() { return lang; }, setLang, onLang, t, fmt, parseMoney, group, copy, flash, leaderLine };
})();
