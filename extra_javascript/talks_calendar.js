// Compact month calendars (see extra_css/talks.css).
//  - Talks page: #talks-calendar, fed by paragraphs marked in Markdown as
//      {: .talk #id data-start="YYYY-MM-DD" data-end="YYYY-MM-DD" data-location="..." }
//    Upcoming talks also get "Add to calendar" links.
//  - Blog index: #blog-calendar, fed by the post excerpts on the page.
// No external requests: the Google Calendar link is only followed when clicked.
document$.subscribe(function () {
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); };
  var now = new Date();
  var today = iso(now.getFullYear(), now.getMonth(), now.getDate());
  var monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

  // Wide screens: move the calendar into a sidebar (data-sidebar="left" = site nav,
  // "right" = table of contents). Narrow screens have no sidebars, so it goes back
  // to where it was written in the page.
  function dock(host) {
    var side = host.dataset.sidebar;
    var sidebar = side && document.querySelector(
      ".md-sidebar--" + (side === "left" ? "primary" : "secondary") + " .md-sidebar__inner");
    if (!sidebar) return;
    var marker = document.createElement("span");
    marker.hidden = true;
    host.before(marker);
    var mq = matchMedia("(min-width: 76.25em)");
    var place = function () { if (mq.matches) sidebar.prepend(host); else marker.after(host); };
    if (window.__tcDock) window.__tcDock.mq.removeEventListener("change", window.__tcDock.fn);
    window.__tcDock = { mq: mq, fn: place };
    mq.addEventListener("change", place);
    place();
  }

  // Instant navigation may keep the sidebars; drop a calendar left from the previous page.
  document.querySelectorAll(".md-sidebar .tc").forEach(function (n) { n.remove(); });

  // events: [{id, title, start, end, href, kind}]; kind picks the colour class.
  function calendar(host, events, focus) {
    var view = { y: +focus.slice(0, 4), m: +focus.slice(5, 7) - 1 };

    function on(day) {
      return events.filter(function (e) { return e.start <= day && day <= e.end; });
    }

    function render() {
      host.textContent = "";
      host.className = "tc";

      var head = document.createElement("div");
      head.className = "tc-head";
      var prev = document.createElement("button");
      prev.type = "button"; prev.textContent = "\u2039"; prev.setAttribute("aria-label", "Previous month");
      var next = document.createElement("button");
      next.type = "button"; next.textContent = "\u203A"; next.setAttribute("aria-label", "Next month");
      var title = document.createElement("span");
      title.className = "tc-title";
      title.textContent = monthName.format(new Date(view.y, view.m, 1));
      prev.onclick = function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); };
      next.onclick = function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); };
      head.append(prev, title, next);

      var grid = document.createElement("div");
      grid.className = "tc-grid";
      ["M", "T", "W", "T", "F", "S", "S"].forEach(function (d) {
        var c = document.createElement("span");
        c.className = "tc-dow"; c.textContent = d; grid.append(c);
      });

      var lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // week starts Monday
      for (var i = 0; i < lead; i++) grid.append(document.createElement("span"));
      var days = new Date(view.y, view.m + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        var day = iso(view.y, view.m, d);
        var hits = on(day);
        var cell = document.createElement(hits.length ? "a" : "span");
        cell.className = "tc-day";
        cell.textContent = d;
        if (day === today) cell.classList.add("tc-today");
        if (hits.length) {
          cell.href = hits[0].href;
          cell.title = hits.map(function (e) { return e.title; }).join("\n");
          cell.classList.add("tc-" + hits[0].kind);
        }
        grid.append(cell);
      }
      host.append(head, grid);
    }
    render();
  }

  // ---- Talks page ---------------------------------------------------------
  var talkHost = document.getElementById("talks-calendar");
  var nodes = document.querySelectorAll(".talk[data-start]");
  if (talkHost && nodes.length) {
    var talks = Array.prototype.map.call(nodes, function (el) {
      var strong = el.querySelector("strong");
      var link = el.querySelector("a");
      var start = el.dataset.start;
      var end = el.dataset.end || start;
      return {
        el: el, id: el.id,
        title: strong ? strong.textContent : el.id,
        url: link ? link.href : location.href.split("#")[0] + "#" + el.id,
        location: el.dataset.location || "",
        start: start, end: end,
        href: "#" + el.id,
        kind: end >= today ? "upcoming" : "past"
      };
    });

    var compact = function (day) { return day.replace(/-/g, ""); };
    var dayAfter = function (day) { // all-day DTEND / Google "dates" end is exclusive
      var d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + 1));
      return iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    };
    var esc = function (s) { return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); };

    var googleUrl = function (t) {
      return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(t.title) +
        "&dates=" + compact(t.start) + "/" + compact(dayAfter(t.end)) +
        "&details=" + encodeURIComponent(t.url) +
        (t.location ? "&location=" + encodeURIComponent(t.location) : "");
    };
    var icsUrl = function (t) {
      var stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, "");
      var lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//moudrick.net//talks//EN", "BEGIN:VEVENT",
        "UID:" + t.id + "@moudrick.net",
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + compact(t.start),
        "DTEND;VALUE=DATE:" + compact(dayAfter(t.end)),
        "SUMMARY:" + esc(t.title),
        "URL:" + t.url
      ];
      if (t.location) lines.push("LOCATION:" + esc(t.location));
      lines.push("END:VEVENT", "END:VCALENDAR");
      return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n") + "\r\n");
    };

    talks.forEach(function (t) {
      var after = t.el.nextElementSibling;
      if (t.kind !== "upcoming" || (after && after.classList.contains("tc-actions"))) return;
      var p = document.createElement("p");
      p.className = "tc-actions";
      var g = document.createElement("a");
      g.href = googleUrl(t); g.target = "_blank"; g.rel = "noopener noreferrer"; g.textContent = "Google Calendar";
      var f = document.createElement("a");
      f.href = icsUrl(t); f.download = t.id + ".ics"; f.textContent = "Download .ics";
      p.append("Add to calendar: ", g, " \u00b7 ", f);
      t.el.after(p);
    });

    var next = talks.filter(function (t) { return t.kind === "upcoming"; })[0] || talks[talks.length - 1];
    calendar(talkHost, talks, next.start);
    dock(talkHost);
  }

  // ---- Blog index ---------------------------------------------------------
  var blogHost = document.getElementById("blog-calendar");
  var excerpts = document.querySelectorAll(".md-post--excerpt");
  if (blogHost && excerpts.length) {
    var posts = [];
    excerpts.forEach(function (ex) {
      var time = ex.querySelector("time[datetime]");
      var a = ex.querySelector("h2 a");
      if (!time || !a) return;
      var day = time.getAttribute("datetime").slice(0, 10);
      posts.push({ title: a.textContent, start: day, end: day, href: a.href, kind: "post" });
    });
    if (posts.length) {
      posts.sort(function (a, b) { return a.start < b.start ? 1 : -1; });
      calendar(blogHost, posts, posts[0].start);
      dock(blogHost);
    }
  }
});
