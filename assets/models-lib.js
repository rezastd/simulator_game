/* ============================================================
   Models Library — richer, articulated 3D animal builders.
   Classic script; relies on window.__THREE (set by each app).
   Exposes window.ModelsLib.BUILDERS and helper primitives.
   Builders return { group, anim: function(t,i)=>... }.
   ============================================================ */
(function () {
  "use strict";
  var T = null;
  var M = {}; // module

  function three() { if (!T) T = window.__THREE; return T; }

  // ---------- primitives ----------
  function mat(color, opts) {
    opts = opts || {};
    return new (three()).MeshStandardMaterial({
      color: color, roughness: opts.roughness != null ? opts.roughness : 0.75,
      metalness: opts.metalness != null ? opts.metalness : 0.05,
      emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity || 1
    });
  }

  function sphere(radius, color, x, y, z, o) {
    o = o || {}; var s = o.scale || [1, 1, 1];
    var m = new (three()).Mesh(new (three()).SphereGeometry(radius, o.seg || 20, o.seg || 20), mat(color, o));
    m.position.set(x || 0, y || 0, z || 0); m.scale.set(s[0], s[1], s[2]);
    m.castShadow = true; return m;
  }
  function box(w, h, d, color, x, y, z, o) {
    o = o || {};
    var m = new (three()).Mesh(new (three()).BoxGeometry(w, h, d), mat(color, o));
    m.position.set(x || 0, y || 0, z || 0);
    if (o.rot) m.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    m.castShadow = true; return m;
  }
  function cyl(rTop, rBottom, h, color, x, y, z, o) {
    o = o || {};
    var m = new (three()).Mesh(new (three()).CylinderGeometry(rTop, rBottom, h, o.seg || 12), mat(color, o));
    m.position.set(x || 0, y || 0, z || 0);
    if (o.rot) m.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    m.castShadow = true; return m;
  }
  function cone(r, h, color, x, y, z, o) {
    o = o || {};
    var m = new (three()).Mesh(new (three()).ConeGeometry(r, h, o.seg || 12), mat(color, o));
    m.position.set(x || 0, y || 0, z || 0);
    if (o.rot) m.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    m.castShadow = true; return m;
  }
  function eye(x, y, z, r, iris) {
    var g = new (three()).Group();
    var white = sphere(r * 1.15, 0xffffff, 0, 0, 0, { roughness: 0.25 });
    var pu = sphere(r * 0.65, 0x0a0a0a, r * 0.25, 0, r * 0.55, { roughness: 0.2 });
    var ir = iris ? sphere(r * 0.72, iris, 0, 0, r * 0.4, { roughness: 0.4 }) : null;
    g.add(white); if (ir) g.add(ir); g.add(pu);
    g.position.set(x, y, z); return g;
  }

  // jointed limb: returns group pivoting at shoulder/hip
  function limb(segLen, radiusTop, radiusBottom, color, opts) {
    opts = opts || {};
    var g = new (three()).Group();
    var upper = cyl(radiusTop, radiusTop * 0.85, segLen, color, 0, -segLen / 2, 0);
    var lower = cyl(radiusTop * 0.85, radiusBottom, segLen * 0.8, color, 0, -segLen * 0.9, 0);
    g.add(upper); g.add(lower);
    g.userData.lower = lower;
    return g;
  }

  // segmented tail
  function tail(segments, startR, endR, length, color, opts) {
    opts = opts || {};
    var g = new (three()).Group();
    var prev = g;
    for (var i = 0; i < segments; i++) {
      var t = i / (segments - 1);
      var r = startR - (startR - endR) * t;
      var seg = cyl(r, r * 0.9, length / segments, color, 0, -length / 2, 0, { seg: 10 });
      seg.position.z = -length / 2 - i * (length / segments) + length / 2;
      seg.rotation.x = opts.curl || 0;
      prev.add(seg);
      prev = seg;
    }
    g.userData.segments = [];
    // collect for animation
    (function collect(node) {
      if (node.userData && node.geometry && node.geometry.type === 'CylinderGeometry') g.userData.segments.push(node);
      (node.children || []).forEach(collect);
    })(g);
    return g;
  }

  // ---------- builders: return {group, anim} ----------
  var BUILDERS = {};

  /* ============ DINOSAURS ============ */
  function dinoBody(color, stomachColor, opts) {
    opts = opts || {};
    var g = new (three()).Group();
    var bodyC = opts.bodyColor || color;
    // torso (egg shape)
    var torso = sphere(1.15, bodyC, 0, 1.45, 0, { scale: [1, 0.78, 1.35], seg: 26, roughness: 0.85 });
    g.add(torso);
    // belly
    var belly = sphere(0.85, stomachColor, 0, 0.75, 0.25, { scale: [1, 0.5, 1.35], seg: 18, roughness: 0.9 });
    g.add(belly);
    // rear hips
    var hips = sphere(0.95, bodyC, -0.55, 1.5, 0, { scale: [1, 0.8, 1.2], seg: 20 });
    g.add(hips);
    return g;
  }

  BUILDERS['trex'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = 0xdfd0b0;
    g.add(dinoBody(c, bellyC));
    // head with snout + brow + teeth
    var head = new (three()).Group();
    head.add(sphere(0.62, c, -0.15, 0, 0, { scale: [1.15, 0.85, 1.1], seg: 22 }));
    head.add(box(0.8, 0.38, 0.5, c, 0.42, -0.12, 0, { roughness: 0.85 }));
    head.add(cone(0.28, 0.5, c, 0.72, -0.2, 0, { rot: [0, 0, Math.PI / 2], seg: 10 }));
    // brow ridge
    for (var i = -1; i <= 1; i += 2) {
      head.add(sphere(0.16, c, 0.28, 0.28, i * 0.3, { scale: [1, 0.6, 0.7] }));
      head.add(eye(0.3, 0.18, i * 0.33, 0.11, 0xffc020));
    }
    // teeth
    for (var k = 0; k < 5; k++) head.add(cone(0.045, 0.22, 0xf5f0e0, 0.38 + k * 0.11, -0.32, 0.12 + (k % 2) * 0.14, { rot: [0, 0, Math.PI], seg: 6 }));
    head.position.set(1.25, 2.75, 0);
    g.add(head);
    // arms (tiny)
    for (var a = -1; a <= 1; a += 2) {
      var arm = new (three()).Group();
      arm.add(cyl(0.11, 0.08, 0.55, c, 0, -0.3, 0));
      arm.add(sphere(0.09, c, 0, -0.6, 0));
      arm.position.set(0.75, 2.05, a * 0.5); arm.rotation.z = a * -0.5;
      g.add(arm);
    }
    // tail (strong, tapered), animated
    var tailg = tail(6, 0.5, 0.1, 2.6, c, { curl: 0.08 });
    tailg.position.set(-1.1, 1.9, 0); tailg.rotation.x = -0.12;
    g.add(tailg);
    // legs (jointed)
    var legs = [];
    var legPositions = [[0.85, 0.42], [-0.95, 0.42]];
    for (var li = 0; li < 2; li++) {
      var leg = limb(1.1, 0.42, 0.22, c, {});
      leg.position.set(legPositions[li][0], 1.35, legPositions[li][1]);
      leg.rotation.z = 0;
      g.add(leg); legs.push(leg);
    }
    return { group: g, anim: dinoWalk(g, tailg, legs) };
  };

  function dinoWalk(g, tailg, legs) {
    return function (t, i) {
      // body bob + tail sway
      g.position.y = Math.abs(Math.sin(t * 0.6 + i)) * 0.2;
      tailg.rotation.y = Math.sin(t * 1.2 + i) * 0.25;
      legs.forEach(function (leg, li) {
        var stride = Math.sin(t * 2.2 + i + li * Math.PI) * 0.4;
        leg.rotation.x = stride;
        leg.userData.lower.rotation.x = -stride * 0.5;
      });
    };
  }

  BUILDERS['trike'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = 0xd8c8a8;
    g.add(dinoBody(c, bellyC, { bodyColor: c }));
    // head + frill + horns
    var head = new (three()).Group();
    head.add(sphere(0.55, c, 0, 0, 0, { scale: [1.1, 0.85, 1.05], seg: 22 }));
    head.add(sphere(0.28, 0xb8756a, 0.52, -0.05, 0, { scale: [1.1, 0.8, 1] }));
    // frill
    var frill = new (three()).Mesh(new (three()).RingGeometry(0.55, 1.0, 26), mat(c, { roughness: 0.8, side: 2 }));
    frill.rotation.y = Math.PI / 2; frill.position.x = -0.45; frill.position.y = 0.15;
    head.add(frill);
    // horns
    head.add(cone(0.14, 0.8, 0xe8dcc8, 0.62, 0.28, 0.28, { rot: [0, 0, -0.4] }));
    head.add(cone(0.14, 0.8, 0xe8dcc8, 0.62, 0.28, -0.28, { rot: [0, 0, -0.4] }));
    head.add(cone(0.16, 0.5, 0xe8dcc8, 0.55, 0.15, 0, { rot: [0, 0, -0.3] }));
    // eyes
    head.add(eye(0.35, 0.28, 0.36, 0.1));
    head.add(eye(0.35, 0.28, -0.36, 0.1));
    head.position.set(1.3, 2.35, 0);
    g.add(head);
    var tailg = tail(5, 0.42, 0.12, 2.0, c, { curl: 0.1 });
    tailg.position.set(-1.0, 1.85, 0); g.add(tailg);
    var legs = [];
    [[0.8, 0.35], [-0.9, 0.35]].forEach(function (p) {
      var leg = limb(1.0, 0.36, 0.24, c); leg.position.set(p[0], 1.3, p[1]); g.add(leg); legs.push(leg);
    });
    return { group: g, anim: dinoWalk(g, tailg, legs) };
  };

  BUILDERS['brach'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = 0xbfd0b8;
    g.add(dinoBody(c, bellyC, { bodyColor: c }));
    // long neck: a chain of segments that climbs upward from the shoulders
    var neck = new (three()).Group();
    var prev = neck;
    for (var i = 0; i < 4; i++) {
      var seg = cyl(0.30 - i * 0.03, 0.44 - i * 0.03, 0.9, c, 0, 0.45, 0, { seg: 12 });
      seg.rotation.z = -0.10 - i * 0.05;
      prev.add(seg); prev = seg;
    }
    var head = new (three()).Group();
    head.add(sphere(0.32, c, 0.22, 0, 0, { scale: [1.35, 0.85, 1], seg: 18 }));
    head.add(sphere(0.15, c, 0.58, -0.03, 0, { scale: [1.4, 0.75, 1] }));
    head.add(eye(0.3, 0.12, 0.24, 0.085));
    head.add(eye(0.3, 0.12, -0.24, 0.085));
    head.position.set(0.45, 0.15, 0);
    prev.add(head);
    neck.position.set(0.9, 2.2, 0); neck.rotation.z = 0.30;
    g.add(neck);
    var tailg = tail(4, 0.4, 0.14, 1.6, c);
    tailg.position.set(-1.1, 2.3, 0); g.add(tailg);
    var legs = [];
    [[0.85, 0.4], [-1.05, 0.4]].forEach(function (p) {
      var leg = limb(1.5, 0.34, 0.2, c); leg.position.set(p[0], 1.6, p[1]); g.add(leg); legs.push(leg);
    });
    return { group: g, anim: dinoWalk(g, tailg, legs) };
  };

  BUILDERS['stego'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = 0xd0d0b0;
    g.add(dinoBody(c, bellyC, { bodyColor: c }));
    // plates along back
    var plateMat = mat(0xa88f4f, { roughness: 0.9 });
    for (var i = -2; i <= 2; i++) {
      var plate = box(0.42, 0.8 - Math.abs(i) * 0.12, 0.12, 0xa88f4f, i * 0.55, 2.55 + Math.abs(i) * 0.08, 0, { rot: [0, 0, i * -0.3] });
      plate.material = plateMat; g.add(plate);
    }
    // head small
    var head = new (three()).Group();
    head.add(sphere(0.36, c, 0.15, 0, 0, { scale: [1.2, 0.8, 1], seg: 16 }));
    head.add(eye(0.25, 0.16, 0.22, 0.08));
    head.position.set(1.5, 2.2, 0); g.add(head);
    // spiked tail
    var tailg = tail(5, 0.4, 0.14, 2.2, c, { curl: 0.1 });
    tailg.position.set(-0.9, 2.0, 0); g.add(tailg);
    for (var s = 0; s < 2; s++) {
      var spike = cone(0.12, 0.7, 0xe8dcc8, -1.9, 2.1, s ? 0.45 : -0.45, { rot: [0, 0, s ? 0.5 : -0.5] });
      g.add(spike);
    }
    var legs = [];
    [[0.8, 0.38], [-0.9, 0.38]].forEach(function (p) {
      var leg = limb(1.0, 0.36, 0.26, c); leg.position.set(p[0], 1.35, p[1]); g.add(leg); legs.push(leg);
    });
    return { group: g, anim: dinoWalk(g, tailg, legs) };
  };

  BUILDERS['raptor'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = 0xd8c8b0;
    g.add(dinoBody(c, bellyC, { bodyColor: c }));
    // sleek head
    var head = new (three()).Group();
    head.add(sphere(0.38, c, 0.1, 0, 0, { scale: [1.15, 0.8, 1], seg: 18 }));
    head.add(cone(0.14, 0.5, c, 0.6, -0.06, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(eye(0.3, 0.14, 0.24, 0.09, 0xffc020));
    head.position.set(1.0, 2.05, 0); g.add(head);
    // arms with claws
    for (var a = -1; a <= 1; a += 2) {
      var arm = limb(0.45, 0.08, 0.05, c); arm.position.set(0.7, 1.8, a * 0.45); arm.rotation.z = a * -0.4; g.add(arm);
      arm.add(cone(0.04, 0.2, 0xf5f0e0, 0, -0.5, 0));
    }
    var tailg = tail(6, 0.3, 0.06, 2.4, c, { curl: 0.12 });
    tailg.position.set(-0.85, 1.7, 0); tailg.rotation.x = -0.15; g.add(tailg);
    var legs = [];
    [[0.6, 0.35], [-0.7, 0.35]].forEach(function (p) {
      var leg = limb(0.85, 0.26, 0.12, c); leg.position.set(p[0], 1.2, p[1]); g.add(leg);
      // killer claw
      leg.add(cone(0.05, 0.3, 0xf5f0e0, 0, -0.95, 0, { rot: [0.3, 0, 0] }));
      legs.push(leg);
    });
    return { group: g, anim: dinoWalk(g, tailg, legs) };
  };

  BUILDERS['ptero'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // body
    g.add(sphere(0.6, c, 0, -0.1, 0, { scale: [1.3, 0.8, 1], seg: 20 }));
    // head + beak
    var head = new (three()).Group();
    head.add(sphere(0.3, c, 0.1, 0, 0, { seg: 14 }));
    head.add(cone(0.1, 0.8, c, 0.7, 0, 0, { rot: [0, 0, Math.PI / 2], seg: 8 }));
    head.add(cone(0.05, 0.35, 0xe8dcc8, 1.15, 0, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(eye(0.25, 0.18, 0.15, 0.07));
    head.position.set(1.0, 0.5, 0); g.add(head);
    // wings (animated)
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var wing = new (three()).Group();
      var wingMesh = new (three()).Mesh(new (three()).PlaneGeometry(3.0, 1.0), mat(c, { side: 2, roughness: 0.85 }));
      wing.add(wingMesh);
      var bone = cyl(0.04, 0.04, 1.5, c, 0, 0, -0.75);
      wing.add(bone);
      wing.position.set(-0.3, 0.1, s * 0.9);
      wing.rotation.y = Math.PI / 2;
      g.add(wing); wings.push(wing);
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 4.5 + Math.sin(t * 0.8 + i) * 1.4;
        g.rotation.z = Math.sin(t * 0.5 + i) * 0.05;
        wings.forEach(function (w, wi) { w.rotation.z = Math.sin(t * 6 + i) * 0.6 * (wi ? 1 : -1); });
      }
    };
  };

  /* ============ OCEAN ============ */
  BUILDERS['clownfish'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    var body = sphere(0.8, c, 0, 0, 0, { scale: [1, 0.55, 1.45], seg: 24, roughness: 0.6 });
    g.add(body);
    g.add(sphere(0.5, c, 0.35, 0.05, 0, { scale: [1, 0.6, 1.1], seg: 18 }));
    // white bands
    var bandMat = mat(0xffffff, { roughness: 0.5 });
    for (var i = 0; i < 2; i++) {
      var band = new (three()).Mesh(new (three()).TorusGeometry(0.5, 0.06, 8, 24), bandMat);
      band.rotation.y = Math.PI / 2; band.position.z = (i - 0.5) * 0.6; g.add(band);
    }
    // tail fin
    g.add(cone(0.35, 0.8, c, -0.85, 0, 0, { rot: [0, Math.PI / 2, 0] }));
    // dorsal fin
    g.add(cone(0.2, 0.55, c, 0.1, 0.7, 0));
    // eyes
    g.add(eye(0.55, 0.28, 0.5, 0.09));
    g.add(eye(0.55, 0.28, -0.5, 0.09));
    g.userData.tail = { z: -0.85 };
    return {
      group: g,
      anim: function (t, i) {
        g.rotation.y = Math.sin(t * 2 + i) * 0.3;
        g.position.y = Math.sin(t + i) * 0.4;
      }
    };
  };

  BUILDERS['turtle'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, shellC = cfg.shell;
    // shell (flattened dome + scutes)
    var shell = sphere(1.1, shellC, 0, 0.3, 0, { scale: [1, 0.45, 1.25], seg: 24, roughness: 0.8 });
    g.add(shell);
    for (var i = 0; i < 6; i++) {
      g.add(sphere(0.28, 0x5a3a2a, (i - 2.5) * 0.34, 0.55, (i % 2 ? 0.35 : -0.35), { scale: [1, 0.5, 1] }));
    }
    // body
    g.add(sphere(1.0, c, 0, -0.05, 0, { scale: [1, 0.42, 1.35], seg: 20 }));
    // flippers
    for (var f = 0; f < 4; f++) {
      var fp = [[0.9, -0.05, 0.9], [-0.9, -0.05, 0.9], [0.9, -0.05, -0.9], [-0.9, -0.05, -0.9]][f];
      var flipper = sphere(0.42, c, fp[0], fp[1], fp[2], { scale: [0.9, 0.4, 2.2], seg: 14 });
      g.add(flipper);
    }
    // head
    var head = new (three()).Group();
    head.add(sphere(0.38, c, 0.2, 0, 0, { scale: [1.2, 0.9, 1], seg: 16 }));
    head.add(eye(0.3, 0.15, 0.26, 0.08, 0x111111));
    head.position.set(0.95, 0.35, 0); g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.rotation.y = Math.sin(t * 0.6 + i) * 0.4;
        g.position.y = Math.sin(t * 0.7 + i) * 0.3;
      }
    };
  };

  BUILDERS['octopus'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.8, c, 0, 0.1, 0, { scale: [1, 0.85, 1], seg: 24, roughness: 0.7 }));
    var arms = [];
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      var arm = new (three()).Group();
      for (var k = 0; k < 4; k++) {
        var r = 0.16 - k * 0.035;
        var seg = sphere(r, c, 0, -k * 0.32, 0, { seg: 10 });
        arm.add(seg);
      }
      arm.position.set(Math.cos(a) * 0.45, -0.35, Math.sin(a) * 0.45);
      arm.rotation.x = Math.sin(a) * 0.5; arm.rotation.z = -Math.cos(a) * 0.5; arm.rotation.y = -a;
      g.add(arm); arms.push(arm);
    }
    g.add(eye(0.35, 0.4, 0.55, 0.12));
    g.add(eye(-0.35, 0.4, 0.55, 0.12));
    return {
      group: g,
      anim: function (t, i) {
        arms.forEach(function (arm, ai) {
          arm.rotation.x = Math.sin(a) * 0.5 + Math.sin(t * 2 + ai) * 0.15;
        });
        g.position.y = Math.sin(t + i) * 0.3;
      }
    };
  };

  BUILDERS['jelly'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    var dome = sphere(0.7, c, 0, 0.1, 0, { scale: [1, 0.6, 1], seg: 24, emissive: c, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
    g.add(dome);
    var legs = [];
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      var leg = new (three()).Mesh(new (three()).CylinderGeometry(0.03, 0.015, 1.1, 6), mat(c, { emissive: c, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 }));
      leg.position.set(Math.cos(a) * 0.4, -0.6, Math.sin(a) * 0.4);
      g.add(leg); legs.push(leg);
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.sin(t + i) * 0.5;
        dome.scale.y = 0.6 + Math.sin(t * 2 + i) * 0.08;
        legs.forEach(function (leg, li) { leg.scale.y = 1 + Math.sin(t * 2 + li) * 0.3; });
      }
    };
  };

  BUILDERS['whale'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // huge streamlined body
    g.add(sphere(3.2, c, 0, 0, 0, { scale: [1, 0.65, 1.7], seg: 32, roughness: 0.4 }));
    g.add(sphere(2.0, c, 2.6, 0, 0, { scale: [1.15, 0.8, 1], seg: 24 }));
    g.add(sphere(1.6, 0xc8d8e8, 1.5, -1.2, 0, { scale: [1, 0.45, 1.6], seg: 20, roughness: 0.6 }));
    // fluke tail
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.9, c, -5.2, 0.1, s * 1.1, { scale: [0.5, 0.35, 1.6], seg: 16 }));
    }
    // pectoral fins
    for (var f = -1; f <= 1; f += 2) {
      g.add(sphere(1.1, c, 0.5, -0.8, f * 2.0, { scale: [0.6, 0.3, 2.4], seg: 16 }));
    }
    // blowhole + eye
    g.add(sphere(0.25, c, 1.0, 2.0, 0));
    g.add(eye(4.4, 1.4, 1.5, 0.4));
    g.add(eye(4.4, 1.4, -1.5, 0.4));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.sin(t * 0.4 + i) * 1.2;
        g.rotation.z = Math.sin(t * 0.3 + i) * 0.06;
      }
    };
  };

  BUILDERS['dolphin'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(1.4, c, 0, 0, 0, { scale: [1, 0.62, 1.7], seg: 24, roughness: 0.45 }));
    // snout
    g.add(cone(0.22, 0.5, c, 2.2, 0, 0, { rot: [0, 0, Math.PI / 2], seg: 12 }));
    // dorsal fin
    var fin = cone(0.4, 0.8, c, 0.1, 0.9, 0, { seg: 10 }); g.add(fin);
    // tail fluke
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.5, c, -2.4, 0.05, s * 0.7, { scale: [0.5, 0.3, 1.5], seg: 14 }));
    }
    // flippers
    for (var f = -1; f <= 1; f += 2) {
      g.add(sphere(0.5, c, 0.4, -0.55, f * 0.95, { scale: [0.6, 0.3, 2], seg: 14 }));
    }
    g.add(eye(2.0, 0.6, 0.85, 0.14));
    g.add(eye(2.0, 0.6, -0.85, 0.14));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.sin(t * 1.5 + i) * 0.6;
        g.rotation.z = Math.sin(t * 1.2 + i) * 0.12;
      }
    };
  };

  BUILDERS['seahorse'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // upright body
    var body = sphere(0.4, c, 0, 0, 0, { scale: [1, 1.5, 0.8], seg: 18 });
    g.add(body);
    // snout
    g.add(cyl(0.09, 0.04, 0.5, c, 0.45, 0.7, 0, { rot: [0, 0, Math.PI / 2] }));
    // head
    g.add(sphere(0.28, c, 0.2, 0.75, 0, { seg: 14 }));
    // curled tail
    var curlT = new (three()).Mesh(new (three()).TorusGeometry(0.3, 0.06, 8, 20), mat(c));
    curlT.position.y = -0.7; curlT.rotation.x = Math.PI / 2; g.add(curlT);
    // dorsal fin
    g.add(cone(0.12, 0.4, c, -0.3, 0.2, 0));
    g.add(eye(0.35, 0.85, 0.2, 0.06));
    return {
      group: g,
      anim: function (t, i) {
        g.rotation.z = Math.sin(t * 2 + i) * 0.12;
        g.position.y = Math.sin(t + i) * 0.2;
      }
    };
  };
  // fix a typo alias guard (defined below)
  // starfish
  BUILDERS['starfish'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2 - 0.63;
      var arm = sphere(0.22, c, Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6, { scale: [1, 0.5, 2.6], seg: 12 });
      arm.rotation.x = Math.sin(a) * Math.PI / 12;
      arm.rotation.z = -Math.cos(a) * Math.PI / 12;
      arm.rotation.y = -a;
      g.add(arm);
    }
    g.add(sphere(0.18, c, 0, 0.16, 0, { seg: 10 }));
    return { group: g, anim: function () {} };
  };

  /* ============ JUNGLE ============ */
  function quadruped(cfg, opts) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = cfg.belly || 0xdfd0b8;
    // barrel torso
    g.add(sphere(opts.torsoR || 1.0, c, 0, opts.torsoY || 1.4, 0, { scale: [1, 0.85, 1.4], seg: 24, roughness: 0.8 }));
    g.add(sphere(opts.bellyR || 0.7, bellyC, 0, (opts.torsoY || 1.4) - 0.7, 0.2, { scale: [1, 0.5, 1.4], seg: 18 }));
    // legs
    var legs = [];
    [[0.75, 0.45], [-0.85, 0.45]].forEach(function (p) {
      var leg = limb(opts.legLen || 1.0, opts.legTopR || 0.24, opts.legBotR || 0.16, c, {});
      leg.position.set(p[0], opts.torsoY || 1.4, p[1]);
      g.add(leg); legs.push(leg);
    });
    // tail
    var tailg = tail(opts.tailSeg || 5, opts.tailR || 0.28, 0.08, opts.tailLen || 1.6, c);
    tailg.position.set(-(opts.torsoR || 1.0) - 0.2, (opts.torsoY || 1.4) - 0.1, 0);
    g.add(tailg);
    return { g: g, legs: legs, tail: tailg };
  }

  BUILDERS['lion'] = function (cfg) {
    var q = quadruped(cfg, { torsoR: 1.1, torsoY: 1.5, legLen: 1.1, legTopR: 0.3, legBotR: 0.18 });
    var g = q.g, c = cfg.color;
    // mane (rings of fluff)
    var mane = new (three()).Group();
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      mane.add(sphere(0.28, 0xb8792f, Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6, { scale: [1, 0.8, 1], roughness: 0.9 }));
    }
    mane.add(sphere(0.4, 0xb8792f, 0, 0.1, 0, { roughness: 0.9 }));
    mane.position.set(1.3, 1.9, 0);
    g.add(mane);
    // head
    var head = new (three()).Group();
    head.add(sphere(0.42, c, 0, 0, 0, { scale: [1.05, 0.9, 1], seg: 18 }));
    head.add(sphere(0.22, c, 0.5, -0.05, 0, { scale: [1.2, 0.8, 1] }));
    var nose = sphere(0.1, 0x3a2a1a, 0.62, -0.18, 0); head.add(nose);
    head.add(eye(0.32, 0.18, 0.3, 0.1, 0xe8a020));
    head.add(eye(0.32, 0.18, -0.3, 0.1, 0xe8a020));
    // ears
    head.add(sphere(0.14, c, -0.1, 0.4, 0.3));
    head.add(sphere(0.14, c, -0.1, 0.4, -0.3));
    // jaw
    head.add(box(0.5, 0.16, 0.34, c, 0.35, -0.38, 0));
    head.position.set(1.6, 2.1, 0);
    g.add(head);
    q.tail.userData.segments.forEach(function () {});
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.12;
        q.tail.rotation.y = Math.sin(t * 1.2 + i) * 0.2;
        q.legs.forEach(function (leg, li) {
          leg.rotation.x = Math.sin(t * 2 + i + li * Math.PI) * 0.3;
        });
      }
    };
  };

  BUILDERS['elephant'] = function (cfg) {
    var q = quadruped(cfg, { torsoR: 1.7, torsoY: 2.3, legLen: 1.7, legTopR: 0.5, legBotR: 0.38 });
    var g = q.g, c = cfg.color;
    // head
    var head = new (three()).Group();
    head.add(sphere(0.95, c, 0, 0, 0, { scale: [1.1, 1, 0.95], seg: 22, roughness: 0.85 }));
    // trunk (segmented, curling)
    var trunk = new (three()).Group();
    var prev = trunk;
    for (var i = 0; i < 5; i++) {
      var seg = cyl(0.28 - i * 0.03, 0.36 - i * 0.03, 0.6, c, 0, -0.3, 0, { seg: 12 });
      seg.position.y = -i * 0.5; seg.rotation.z = 0.12 + i * 0.05;
      prev.add(seg); prev = seg;
    }
    trunk.position.set(0.9, -0.35, 0); trunk.rotation.z = 0.35;
    head.add(trunk);
    // ears (big, floppy)
    for (var e = -1; e <= 1; e += 2) {
      var ear = sphere(0.7, c, -0.3, 0.1, e * 0.75, { scale: [1.3, 1, 0.35], seg: 18 });
      head.add(ear);
    }
    // tusks
    for (var t = 0; t < 2; t++) {
      var tusk = cone(0.11, 0.7, 0xf5f0e0, 0.75, -0.4, t ? 0.28 : -0.28, { rot: [0, 0, -0.35] });
      head.add(tusk);
    }
    head.add(eye(0.6, 0.35, 0.5, 0.16, 0x222222));
    head.add(eye(0.6, 0.35, -0.5, 0.16, 0x222222));
    head.position.set(2.1, 3.0, 0);
    g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.4 + i)) * 0.1;
        trunk.rotation.z = 0.35 + Math.sin(t * 0.6 + i) * 0.08;
        q.legs.forEach(function (leg, li) {
          leg.rotation.x = Math.sin(t * 1.4 + i + li * Math.PI) * 0.2;
        });
      }
    };
  };

  BUILDERS['giraffe'] = function (cfg) {
    var q = quadruped(cfg, { torsoR: 1.0, torsoY: 2.6, legLen: 2.2, legTopR: 0.22, legBotR: 0.14 });
    var g = q.g, c = cfg.color;
    // neck: chain of segments climbing upward from the shoulders
    var neck = new (three()).Group();
    var prev = neck;
    for (var i = 0; i < 5; i++) {
      var seg = cyl(0.19, 0.28, 0.8, c, 0, 0.4, 0, { seg: 12 });
      seg.rotation.z = -0.06 - i * 0.04;
      prev.add(seg); prev = seg;
    }
    var head = new (three()).Group();
    head.add(sphere(0.3, c, 0.18, 0, 0, { scale: [1.25, 0.85, 1], seg: 16 }));
    head.add(cone(0.08, 0.3, c, 0.58, -0.05, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(eye(0.28, 0.16, 0.22, 0.08));
    head.position.set(0.35, 0.1, 0);
    prev.add(head);
    neck.position.set(0.95, 3.1, 0); neck.rotation.z = 0.34;
    g.add(neck);
    // ossicones (little horns)
    head.add(cyl(0.05, 0.07, 0.35, 0x5a3a22, 0.05, 0.5, 0.15));
    head.add(cyl(0.05, 0.07, 0.35, 0x5a3a22, 0.05, 0.5, -0.15));
    // spots
    for (var k = 0; k < 7; k++) {
      g.add(sphere(0.14, cfg.spot || 0xb8863a, (k - 3) * 0.35, 2.8 + Math.sin(k) * 0.2, (k % 2 ? 0.4 : -0.4), { roughness: 0.9 }));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.12;
        neck.rotation.z = -0.3 + Math.sin(t * 0.7 + i) * 0.04;
        q.legs.forEach(function (leg, li) {
          leg.rotation.x = Math.sin(t * 1.8 + i + li * Math.PI) * 0.25;
        });
      }
    };
  };

  BUILDERS['monkey'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.6, c, 0, 1.2, 0, { scale: [1, 1.1, 0.85], seg: 20 }));
    // head
    var head = new (three()).Group();
    head.add(sphere(0.4, c, 0.1, 0, 0, { seg: 16 }));
    head.add(sphere(0.24, 0xf0c8a0, 0.5, 0.05, 0, { scale: [1.2, 0.9, 1] }));
    head.add(eye(0.42, 0.25, 0.3, 0.09, 0x3a2a1a));
    head.position.set(0.6, 1.9, 0);
    g.add(head);
    // ears
    g.add(sphere(0.18, c, -0.1, 2.0, 0.4));
    g.add(sphere(0.18, c, -0.1, 2.0, -0.4));
    // long tail (animated)
    var tailg = tail(8, 0.14, 0.04, 2.0, c, { curl: 0.15 });
    tailg.position.set(-0.6, 1.2, 0); g.add(tailg);
    // arms/legs
    for (var a = -1; a <= 1; a += 2) {
      var arm = limb(0.7, 0.12, 0.07, c); arm.position.set(0.5, 1.5, a * 0.55); arm.rotation.z = a * -0.5; g.add(arm);
    }
    var legs = [];
    [[0.1, 0.4], [-0.1, 0.4]].forEach(function (p) {
      var leg = limb(0.6, 0.13, 0.08, c); leg.position.set(p[0], 0.7, p[1]); g.add(leg); legs.push(leg);
    });
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.8 + i)) * 0.15;
        tailg.rotation.y = Math.sin(t * 1.6 + i) * 0.5;
        legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 2.4 + i + li * Math.PI) * 0.4; });
      }
    };
  };

  BUILDERS['parrot'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, wingC = cfg.wing;
    g.add(sphere(0.5, c, 0, 0.6, 0, { scale: [1, 1.1, 0.9], seg: 20 }));
    // head + hooked beak
    var head = new (three()).Group();
    head.add(sphere(0.34, c, 0.1, 0, 0, { seg: 16 }));
    head.add(cone(0.12, 0.4, 0xe8c060, 0.5, -0.06, 0, { rot: [0, 0, Math.PI / 2], seg: 8 }));
    head.add(eye(0.15, 0.2, 0.26, 0.07));
    head.position.set(0.5, 1.2, 0);
    g.add(head);
    // tail feathers
    for (var t = 0; t < 3; t++) {
      g.add(cone(0.08, 0.8, wingC, -0.4, 0.3, (t - 1) * 0.18, { rot: [0, 0, Math.PI] }));
    }
    // wings (animated)
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var wing = new (three()).Group();
      var mesh = new (three()).Mesh(new (three()).PlaneGeometry(0.95, 0.65), mat(wingC, { side: 2 }));
      wing.add(mesh); wing.position.set(-0.1, 0.6, s * 0.5);
      wing.rotation.y = Math.PI / 2;
      g.add(wing); wings.push(wing);
    }
    // legs
    for (var l = 0; l < 2; l++) {
      var leg = cyl(0.05, 0.04, 0.5, 0xc8a060, l ? 0.2 : -0.2, 0.25, 0);
      g.add(leg);
    }
    return {
      group: g,
      anim: function (t, i) {
        wings.forEach(function (w, wi) { w.rotation.z = Math.sin(t * 14 + i) * 0.5 * (wi ? 1 : -1); });
        g.position.y = Math.sin(t + i) * 0.15;
      }
    };
  };

  BUILDERS['zebra'] = function (cfg) {
    var q = quadruped(cfg, { torsoR: 1.1, torsoY: 1.6, legLen: 1.2, legTopR: 0.28, legBotR: 0.18 });
    var g = q.g, c = cfg.color, stripeC = cfg.stripe;
    // zebra body stripes
    for (var i = -3; i <= 3; i++) {
      var st = box(0.18, 0.55, 1.6, stripeC, i * 0.4, 1.7, 0);
      g.add(st);
    }
    var head = new (three()).Group();
    head.add(sphere(0.4, c, 0, 0, 0, { scale: [1, 0.95, 1], seg: 18 }));
    head.add(cone(0.2, 0.4, stripeC, 0.55, -0.05, 0, { rot: [0, 0, Math.PI / 2] }));
    // mane
    for (var m = 0; m < 5; m++) {
      head.add(sphere(0.09, stripeC, -0.25 + m * 0.12, 0.42, 0));
    }
    head.add(eye(0.25, 0.2, 0.28, 0.09));
    head.position.set(1.5, 2.1, 0);
    g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.12;
        q.tail.rotation.y = Math.sin(t * 1.4 + i) * 0.25;
        q.legs.forEach(function (leg, li) {
          leg.rotation.x = Math.sin(t * 2.2 + i + li * Math.PI) * 0.3;
        });
      }
    };
  };

  /* ============ POLAR ============ */
  BUILDERS['polarbear'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // heavy barrel body
    g.add(sphere(1.25, c, 0, 1.25, 0, { scale: [1, 0.85, 1.45], seg: 26, roughness: 0.9 }));
    g.add(sphere(0.85, 0xf2f0e6, 0, 0.7, 0.2, { scale: [1, 0.5, 1.4], seg: 18 }));
    // shoulder hump
    g.add(sphere(0.6, c, 0.55, 1.85, 0, { scale: [1, 0.7, 1.1], seg: 18 }));
    // head with long snout + small ears
    var head = new (three()).Group();
    head.add(sphere(0.5, c, 0, 0, 0, { scale: [1, 0.95, 1.05], seg: 20 }));
    head.add(sphere(0.3, c, 0.62, -0.08, 0, { scale: [1.3, 0.85, 1] }));
    head.add(sphere(0.11, c, 0.05, 0.5, 0.3));
    head.add(sphere(0.11, c, 0.05, 0.5, -0.3));
    head.add(eye(0.3, 0.2, 0.32, 0.1, 0x3a2a1a));
    head.add(eye(0.3, 0.2, -0.32, 0.1, 0x3a2a1a));
    head.add(sphere(0.09, 0x222222, 0.86, -0.1, 0));
    head.position.set(1.5, 1.6, 0);
    g.add(head);
    // four jointed legs
    var legs = [];
    [[0.85, 0.55], [0.5, 0.55], [-0.95, 0.55], [-1.25, 0.55]].forEach(function (p) {
      var leg = limb(0.95, 0.34, 0.26, c);
      leg.position.set(p[0], 1.1, p[1]);
      g.add(leg); legs.push(leg);
    });
    // small tail
    g.add(sphere(0.22, c, -1.55, 1.2, 0));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.4 + i)) * 0.1;
        legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 1.2 + i + li * Math.PI) * 0.22; });
      }
    };
  };

  BUILDERS['penguin'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, bellyC = cfg.belly || 0xf8f8f0;
    // upright body
    g.add(sphere(0.6, c, 0, 0.85, 0, { scale: [1, 1.5, 0.95], seg: 24, roughness: 0.75 }));
    g.add(sphere(0.5, bellyC, 0.12, 0.85, 0.42, { scale: [1, 1.45, 0.5], seg: 20 }));
    // head
    var head = new (three()).Group();
    head.add(sphere(0.36, c, 0, 0, 0, { seg: 18 }));
    head.add(sphere(0.2, bellyC, 0.2, -0.1, 0, { scale: [1.1, 0.9, 1] }));
    head.add(cone(0.09, 0.34, 0xff8c2f, 0.55, -0.06, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(eye(0.12, 0.14, 0.26, 0.08));
    head.add(eye(0.12, 0.14, -0.26, 0.08));
    head.position.set(0, 1.85, 0);
    g.add(head);
    // wings
    for (var s = -1; s <= 1; s += 2) {
      var w = sphere(0.28, c, 0, 0.9, s * 0.55, { scale: [0.7, 1.7, 0.4], seg: 14 });
      g.add(w);
    }
    // feet
    for (var f = -1; f <= 1; f += 2) {
      g.add(sphere(0.22, 0xff8c2f, 0.1, 0.08, f * 0.25, { scale: [1.3, 0.4, 1.1] }));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.9 + i)) * 0.12;
        g.rotation.z = Math.sin(t * 0.7 + i) * 0.06;
      }
    };
  };

  BUILDERS['seal'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.8, c, 0, 0.45, 0, { scale: [1, 0.75, 1.6], seg: 24, roughness: 0.55 }));
    // head
    var head = new (three()).Group();
    head.add(sphere(0.36, c, 0.45, 0, 0, { scale: [1.1, 0.95, 1], seg: 18 }));
    head.add(sphere(0.12, 0x222222, 0.78, -0.05, 0));
    head.add(eye(0.55, 0.18, 0.26, 0.1));
    head.add(eye(0.55, 0.18, -0.26, 0.1));
    head.position.set(0.85, 0.75, 0);
    g.add(head);
    // rear flippers
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.3, c, -1.35, 0.35, s * 0.45, { scale: [0.6, 0.3, 1.8], seg: 14 }));
    }
    // side flippers
    for (var f = -1; f <= 1; f += 2) {
      g.add(sphere(0.26, c, 0.3, 0.25, f * 0.65, { scale: [0.7, 0.3, 1.8], seg: 14 }));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.35 + Math.sin(t * 0.8 + i) * 0.25;
        g.rotation.y = Math.sin(t * 0.4 + i) * 0.2;
      }
    };
  };

  BUILDERS['walrus'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(1.0, c, 0, 0.7, 0, { scale: [1, 0.8, 1.5], seg: 24, roughness: 0.75 }));
    g.add(sphere(0.7, 0xb08a6a, 0, 0.35, 0.3, { scale: [1, 0.5, 1.3], seg: 16 }));
    // head + whiskers + tusks
    var head = new (three()).Group();
    head.add(sphere(0.45, c, 0.4, 0, 0, { scale: [1.1, 0.95, 1], seg: 18 }));
    head.add(sphere(0.14, 0x2a2a2a, 0.85, -0.05, 0));
    head.add(eye(0.5, 0.22, 0.3, 0.09));
    head.add(eye(0.5, 0.22, -0.3, 0.09));
    for (var t = 0; t < 2; t++) {
      var tusk = cone(0.09, 0.85, 0xf0ead8, 0.72, -0.45, t ? 0.22 : -0.22, { rot: [0, 0, -0.15] });
      head.add(tusk);
    }
    for (var w = 0; w < 6; w++) {
      head.add(cyl(0.012, 0.012, 0.5, 0xe8e0d0, 0.9, -0.2, (w - 2.5) * 0.12, { rot: [0, 0, Math.PI / 2.4] }));
    }
    head.position.set(1.1, 1.05, 0);
    g.add(head);
    var legs = [];
    [[0.7, 0.5], [-0.8, 0.5]].forEach(function (p) {
      var leg = limb(0.6, 0.32, 0.28, c);
      leg.position.set(p[0], 0.7, p[1]);
      g.add(leg); legs.push(leg);
    });
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.1;
        legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 1.4 + i + li * Math.PI) * 0.2; });
      }
    };
  };

  BUILDERS['arcticfox'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.55, c, 0, 0.6, 0, { scale: [1, 0.85, 1.4], seg: 22, roughness: 0.95 }));
    // very bushy tail
    var tailg = tail(6, 0.28, 0.14, 1.2, c, { curl: 0.15 });
    tailg.position.set(-0.75, 0.65, 0);
    tailg.rotation.z = 0.2;
    g.add(tailg);
    // head with pointed ears
    var head = new (three()).Group();
    head.add(sphere(0.32, c, 0.35, 0, 0, { scale: [1.1, 0.9, 1], seg: 18 }));
    head.add(cone(0.13, 0.3, c, 0.2, 0.32, 0.18));
    head.add(cone(0.13, 0.3, c, 0.2, 0.32, -0.18));
    head.add(sphere(0.07, 0x222222, 0.66, -0.02, 0));
    head.add(eye(0.45, 0.13, 0.22, 0.08, 0x8ab040));
    head.add(eye(0.45, 0.13, -0.22, 0.08, 0x8ab040));
    head.position.set(0.75, 0.85, 0);
    g.add(head);
    var legs = [];
    [[0.4, 0.3], [-0.45, 0.3]].forEach(function (p) {
      var leg = limb(0.5, 0.16, 0.12, c);
      leg.position.set(p[0], 0.55, p[1]);
      g.add(leg); legs.push(leg);
    });
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.7 + i)) * 0.08;
        tailg.rotation.y = Math.sin(t * 1.8 + i) * 0.3;
        legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 2.4 + i + li * Math.PI) * 0.3; });
      }
    };
  };

  BUILDERS['snowyowl'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // round fluffy body
    g.add(sphere(0.6, c, 0, 0, 0, { scale: [1, 1.25, 1], seg: 22, roughness: 0.98 }));
    // speckled chest
    for (var i = 0; i < 8; i++) {
      g.add(sphere(0.09, 0xc8c0b0, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.1, 0.5, { seg: 8 }));
    }
    var head = new (three()).Group();
    head.add(sphere(0.4, c, 0, 0, 0, { seg: 18 }));
    head.add(sphere(0.2, 0xf0e8d8, 0.3, -0.08, 0, { scale: [1, 0.8, 1] }));
    head.add(cone(0.08, 0.2, 0xe8a020, 0.48, -0.04, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(eye(0.2, 0.18, 0.26, 0.1, 0xffc020));
    head.add(eye(0.2, 0.18, -0.26, 0.1, 0xffc020));
    head.position.set(0.1, 0.75, 0);
    g.add(head);
    // wings
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var w = new (three()).Group();
      var m = new (three()).Mesh(new (three()).PlaneGeometry(0.95, 0.6), mat(c, { side: 2, roughness: 0.98 }));
      w.add(m);
      w.position.set(-0.1, 0, s * 0.55);
      w.rotation.y = Math.PI / 2;
      g.add(w); wings.push(w);
    }
    // talons
    for (var f = 0; f < 2; f++) {
      g.add(cyl(0.05, 0.04, 0.2, 0xe8c060, f ? 0.15 : -0.15, -0.7, 0));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 2.0 + Math.sin(t * 0.7 + i) * 0.2;
        wings.forEach(function (w, wi) { w.rotation.z = Math.sin(t * 3 + i) * 0.25 * (wi ? 1 : -1); });
        g.rotation.y = Math.sin(t * 0.3 + i) * 0.3;
      }
    };
  };

  /* ============ RAINFOREST ============ */
  BUILDERS['toucan'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, beakC = cfg.beak;
    g.add(sphere(0.45, c, 0, 0, 0, { scale: [1, 0.95, 1.3], seg: 20, roughness: 0.7 }));
    g.add(sphere(0.3, 0x2a2a2a, 0, 0.1, 0.4, { scale: [0.8, 1, 1.3] }));
    // huge colorful beak
    var beak = new (three()).Group();
    beak.add(cone(0.16, 0.95, beakC, 0.5, 0, 0, { rot: [0, 0, Math.PI / 2], seg: 10 }));
    beak.add(sphere(0.14, 0xe8a030, 0.1, 0.08, 0));
    beak.add(cone(0.12, 0.4, 0xd8802f, 0.3, -0.1, 0, { rot: [0, 0, Math.PI / 2.2] }));
    beak.position.set(0.3, 0.08, 0);
    g.add(beak);
    g.add(eye(0.25, 0.22, 0.3, 0.09, 0xf0d040));
    // tail
    for (var t = 0; t < 3; t++) {
      g.add(cone(0.07, 0.6, 0xd8502f, -0.55, -0.05, (t - 1) * 0.16, { rot: [0, 0, Math.PI] }));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 7.2 + Math.sin(t * 0.7 + i) * 0.25;
        g.rotation.y = Math.sin(t * 0.4 + i) * 0.5;
      }
    };
  };

  BUILDERS['sloth'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.5, c, 0, 0, 0, { scale: [1, 1.35, 0.9], seg: 20, roughness: 1 }));
    // shaggy fur tufts
    for (var i = 0; i < 10; i++) {
      g.add(sphere(0.14, 0x9a8a68, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.5, { seg: 8 }));
    }
    // head with sleepy face
    var head = new (three()).Group();
    head.add(sphere(0.36, c, 0, 0, 0, { scale: [1, 0.95, 0.9], seg: 18 }));
    head.add(sphere(0.2, 0xd8c8a8, 0.28, -0.05, 0, { scale: [1, 0.8, 1] }));
    head.add(eye(0.2, 0.12, 0.24, 0.07));
    head.add(eye(0.2, 0.12, -0.24, 0.07));
    head.position.set(0.05, 0.72, 0);
    g.add(head);
    // long arms with claws
    for (var s = -1; s <= 1; s += 2) {
      var arm = limb(0.7, 0.13, 0.1, c);
      arm.position.set(0.15, 0.3, s * 0.4);
      arm.rotation.z = 2.9;
      g.add(arm);
      arm.add(cone(0.035, 0.18, 0x5a4a30, 0, -0.72, 0));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 6.2 + Math.sin(t * 0.5 + i) * 0.2;
        g.rotation.z = Math.sin(t * 0.4 + i) * 0.08;
      }
    };
  };

  BUILDERS['jaguar'] = function (cfg) {
    var q = quadruped(cfg, { torsoR: 1.0, torsoY: 1.0, legLen: 0.75, legTopR: 0.26, legBotR: 0.18 });
    var g = q.g, c = cfg.color;
    // rosette spots
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      g.add(sphere(0.11, 0x8a5a2a, Math.cos(a) * 0.8, 1.05 + (i % 3) * 0.2, Math.sin(a) * 0.7, { scale: [1, 1, 0.6], seg: 8 }));
    }
    // head
    var head = new (three()).Group();
    head.add(sphere(0.42, c, 0, 0, 0, { scale: [1.05, 0.9, 1], seg: 18 }));
    head.add(sphere(0.2, 0xdfd0b0, 0.42, -0.06, 0, { scale: [1, 0.7, 1] }));
    head.add(sphere(0.08, 0x222222, 0.58, -0.04, 0));
    head.add(eye(0.26, 0.18, 0.28, 0.1, 0x9ac040));
    head.add(eye(0.26, 0.18, -0.28, 0.1, 0x9ac040));
    head.add(sphere(0.11, c, -0.05, 0.36, 0.24));
    head.add(sphere(0.11, c, -0.05, 0.36, -0.24));
    head.position.set(1.25, 1.2, 0);
    g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.1;
        q.tail.rotation.y = Math.sin(t * 1.4 + i) * 0.3;
        q.legs.forEach(function (leg, li) {
          leg.rotation.x = Math.sin(t * 2 + i + li * Math.PI) * 0.28;
        });
      }
    };
  };

  BUILDERS['poisonfrog'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.18, c, 0, 0.18, 0, { scale: [1.1, 0.75, 1.3], seg: 16, roughness: 0.5 }));
    // bright warning markings
    g.add(sphere(0.09, 0x2a2a2a, 0, 0.24, 0.08, { scale: [1, 0.5, 1.3] }));
    g.add(sphere(0.07, 0x2a2a2a, 0.04, 0.24, -0.1, { scale: [1, 0.5, 1.2] }));
    // bulging eyes
    g.add(sphere(0.08, 0xffffff, 0.13, 0.28, 0.1));
    g.add(sphere(0.08, 0xffffff, 0.13, 0.28, -0.1));
    g.add(sphere(0.04, 0x111111, 0.15, 0.29, 0.1));
    g.add(sphere(0.04, 0x111111, 0.15, 0.29, -0.1));
    // legs
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.08, c, 0.12, 0.06, s * 0.18, { scale: [1.2, 0.5, 1.2] }));
      g.add(sphere(0.06, c, -0.12, 0.06, s * 0.16, { scale: [1.2, 0.5, 1.2] }));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.3 + Math.abs(Math.sin(t * 1.6 + i)) * 0.3;
        g.rotation.y = Math.sin(t * 0.6 + i) * 0.6;
      }
    };
  };

  /* ============ FARM ============ */
  function farmQuadruped(cfg, opts) {
    var q = quadruped(cfg, opts);
    return q;
  }

  BUILDERS['cow'] = function (cfg) {
    var q = farmQuadruped(cfg, { torsoR: 1.05, torsoY: 1.5, legLen: 1.1, legTopR: 0.22, legBotR: 0.16 });
    var g = q.g, c = cfg.color;
    // black-and-white patches
    for (var i = 0; i < 5; i++) {
      g.add(sphere(0.3, cfg.spot, (Math.random() - 0.5) * 1.5, 1.5 + (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.3, { scale: [1, 0.6, 1.2], seg: 12 }));
    }
    // head with horns + muzzle
    var head = new (three()).Group();
    head.add(sphere(0.45, c, 0, 0, 0, { scale: [1, 0.95, 1], seg: 18 }));
    head.add(sphere(0.28, 0xf0c8b8, 0.5, -0.1, 0, { scale: [1, 0.8, 1] }));
    head.add(sphere(0.06, 0x8a6a5a, 0.74, -0.08, 0.1));
    head.add(sphere(0.06, 0x8a6a5a, 0.74, -0.08, -0.1));
    head.add(cone(0.08, 0.28, 0xd8c8a0, 0.05, 0.42, 0.26, { rot: [0.2, 0, 0.3] }));
    head.add(cone(0.08, 0.28, 0xd8c8a0, 0.05, 0.42, -0.26, { rot: [-0.2, 0, 0.3] }));
    head.add(eye(0.3, 0.18, 0.3, 0.09));
    head.add(eye(0.3, 0.18, -0.3, 0.09));
    head.position.set(1.35, 1.85, 0);
    g.add(head);
    // udder + tail
    g.add(sphere(0.25, 0xf0b0b0, -0.5, 0.9, 0));
    q.tail.userData.segments;
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.4 + i)) * 0.08;
        q.tail.rotation.y = Math.sin(t * 1.2 + i) * 0.25;
        q.legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 1.8 + i + li * Math.PI) * 0.22; });
      }
    };
  };

  BUILDERS['pig'] = function (cfg) {
    var q = farmQuadruped(cfg, { torsoR: 0.95, torsoY: 1.2, legLen: 0.75, legTopR: 0.2, legBotR: 0.16 });
    var g = q.g, c = cfg.color;
    // curly tail
    var curl = new (three()).Mesh(new (three()).TorusGeometry(0.2, 0.06, 8, 18), mat(c));
    curl.position.set(-1.0, 1.35, 0); curl.rotation.x = Math.PI / 2;
    g.add(curl);
    // head with snout
    var head = new (three()).Group();
    head.add(sphere(0.42, c, 0, 0, 0, { scale: [1, 0.95, 1], seg: 18 }));
    head.add(cyl(0.2, 0.22, 0.18, cfg.spot, 0.5, -0.1, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(sphere(0.04, 0x8a4a5a, 0.58, -0.1, 0.08));
    head.add(sphere(0.04, 0x8a4a5a, 0.58, -0.1, -0.08));
    head.add(eye(0.28, 0.2, 0.28, 0.08));
    head.add(eye(0.28, 0.2, -0.28, 0.08));
    head.add(cone(0.09, 0.22, c, 0.05, 0.36, 0.2));
    head.add(cone(0.09, 0.22, c, 0.05, 0.36, -0.2));
    head.position.set(1.15, 1.35, 0);
    g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.08;
        q.legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 2 + i + li * Math.PI) * 0.22; });
      }
    };
  };

  BUILDERS['sheep'] = function (cfg) {
    var q = farmQuadruped(cfg, { torsoR: 0.9, torsoY: 1.2, legLen: 0.9, legTopR: 0.14, legBotR: 0.12 });
    var g = q.g, c = cfg.color;
    // woolly fleece blobs
    for (var i = 0; i < 12; i++) {
      g.add(sphere(0.32, c, (Math.random() - 0.5) * 1.6, 1.2 + (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.4, { roughness: 1 }));
    }
    // dark face + legs
    var head = new (three()).Group();
    head.add(sphere(0.32, cfg.spot, 0, 0, 0, { scale: [1.1, 0.9, 0.9], seg: 16 }));
    head.add(sphere(0.16, cfg.spot, 0.3, -0.05, 0, { scale: [1, 0.8, 1] }));
    head.add(eye(0.22, 0.15, 0.24, 0.08));
    head.add(eye(0.22, 0.15, -0.24, 0.08));
    head.add(sphere(0.11, c, -0.1, 0.28, 0.2));
    head.add(sphere(0.11, c, -0.1, 0.28, -0.2));
    head.position.set(1.0, 1.4, 0);
    g.add(head);
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.07;
        q.legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 2.2 + i + li * Math.PI) * 0.22; });
      }
    };
  };

  BUILDERS['horse'] = function (cfg) {
    var q = farmQuadruped(cfg, { torsoR: 1.1, torsoY: 1.6, legLen: 1.3, legTopR: 0.24, legBotR: 0.16 });
    var g = q.g, c = cfg.color;
    // long neck + head
    var neck = new (three()).Group();
    neck.add(cyl(0.24, 0.38, 1.5, c, 0, -0.75, 0, { seg: 12 }));
    var head = new (three()).Group();
    head.add(sphere(0.32, c, 0.2, 0, 0, { scale: [1.5, 0.85, 0.85], seg: 16 }));
    head.add(cone(0.1, 0.26, c, -0.05, 0.3, 0.16));
    head.add(cone(0.1, 0.26, c, -0.05, 0.3, -0.16));
    head.add(sphere(0.08, cfg.spot, 0.6, -0.05, 0));
    head.add(eye(0.3, 0.15, 0.2, 0.08));
    head.add(eye(0.3, 0.15, -0.2, 0.08));
    head.add(sphere(0.18, cfg.spot, 0.05, 0.1, 0));
    head.add(sphere(0.18, cfg.spot, 0.05, 0.1, 0));
    head.position.set(0.4, -1.4, 0);
    neck.add(head);
    neck.position.set(1.0, 2.3, 0); neck.rotation.z = -0.55;
    g.add(neck);
    // mane + tail
    for (var i = 0; i < 6; i++) g.add(sphere(0.12, cfg.spot, 0.1 + i * 0.1, 2.5 - i * 0.12, 0));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = Math.abs(Math.sin(t * 0.5 + i)) * 0.1;
        neck.rotation.z = -0.55 + Math.sin(t * 0.6 + i) * 0.04;
        q.tail.rotation.y = Math.sin(t * 1.4 + i) * 0.25;
        q.legs.forEach(function (leg, li) { leg.rotation.x = Math.sin(t * 2 + i + li * Math.PI) * 0.3; });
      }
    };
  };

  BUILDERS['chicken'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.42, c, 0, 0.55, 0, { scale: [1, 1.1, 1.2], seg: 20, roughness: 0.85 }));
    // wings
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.28, cfg.spot, -0.05, 0.5, s * 0.38, { scale: [1.2, 0.8, 0.4], seg: 12 }));
    }
    // head + comb + beak + wattle
    var head = new (three()).Group();
    head.add(sphere(0.26, c, 0.15, 0, 0, { seg: 16 }));
    head.add(cone(0.1, 0.24, 0xffa030, 0.45, -0.02, 0, { rot: [0, 0, Math.PI / 2] }));
    head.add(sphere(0.07, cfg.spot, 0.18, 0.26, 0));
    head.add(sphere(0.06, cfg.spot, 0.18, 0.26, 0));
    head.add(sphere(0.05, cfg.spot, 0.4, -0.14, 0));
    head.add(eye(0.2, 0.1, 0.18, 0.07));
    head.add(eye(0.2, 0.1, -0.18, 0.07));
    head.position.set(0.2, 1.15, 0);
    g.add(head);
    // tail feathers
    for (var t = 0; t < 4; t++) {
      g.add(cone(0.09, 0.5, cfg.spot, -0.42, 0.7, (t - 1.5) * 0.14, { rot: [0, 0, 1.1] }));
    }
    // legs
    for (var l = 0; l < 2; l++) g.add(cyl(0.05, 0.05, 0.35, 0xffa030, l ? 0.1 : -0.1, 0.15, 0));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.15 + Math.abs(Math.sin(t * 1.4 + i)) * 0.12;
        g.rotation.y = Math.sin(t * 0.6 + i) * 0.4;
      }
    };
  };

  BUILDERS['duck'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.4, c, 0, 0.45, 0, { scale: [1, 0.95, 1.35], seg: 20, roughness: 0.8 }));
    // wing
    for (var s = -1; s <= 1; s += 2) {
      g.add(sphere(0.26, cfg.spot, -0.05, 0.5, s * 0.34, { scale: [1.2, 0.7, 0.4], seg: 12 }));
    }
    // head + bill
    var head = new (three()).Group();
    head.add(sphere(0.24, c, 0.3, 0, 0, { seg: 16 }));
    head.add(sphere(0.11, 0xffc040, 0.55, -0.04, 0, { scale: [1.4, 0.6, 1] }));
    head.add(eye(0.32, 0.12, 0.16, 0.07));
    head.add(eye(0.32, 0.12, -0.16, 0.07));
    head.position.set(0.2, 0.95, 0);
    g.add(head);
    // tail
    g.add(cone(0.12, 0.4, c, -0.42, 0.5, 0, { rot: [0, 0, 1.2] }));
    // webbed feet
    for (var l = 0; l < 2; l++) g.add(sphere(0.14, 0xffc040, l ? 0.08 : -0.08, 0.06, 0, { scale: [1.2, 0.35, 1.4] }));
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.35 + Math.sin(t * 1.2 + i) * 0.15;
        g.rotation.y = Math.sin(t * 0.5 + i) * 0.35;
      }
    };
  };

  /* ============ BUGS ============ */
  BUILDERS['ladybug'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.22, c, 0, 0.18, 0, { scale: [1, 0.65, 1.2], seg: 18, roughness: 0.35 }));
    // shell split line
    g.add(box(0.02, 0.03, 0.45, 0x8a1a1a, 0, 0.3, 0));
    // spots
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2;
      g.add(sphere(0.045, cfg.spot, Math.cos(a) * 0.13, 0.26, Math.sin(a) * 0.16, { seg: 8 }));
    }
    // head + antennae
    var head = new (three()).Group();
    head.add(sphere(0.1, 0x1a1a1a, 0.16, 0.14, 0, { seg: 12 }));
    head.add(cyl(0.012, 0.012, 0.2, 0x1a1a1a, 0.2, 0.26, 0.06, { rot: [0.4, 0, 0.6] }));
    head.add(cyl(0.012, 0.012, 0.2, 0x1a1a1a, 0.2, 0.26, -0.06, { rot: [-0.4, 0, 0.6] }));
    head.add(eye(0.2, 0.16, 0.08, 0.035));
    head.add(eye(0.2, 0.16, -0.08, 0.035));
    g.add(head);
    // legs
    for (var l = 0; l < 3; l++) {
      for (var s = -1; s <= 1; s += 2) {
        g.add(cyl(0.012, 0.012, 0.16, 0x1a1a1a, -0.06 + l * 0.09, 0.1, s * 0.17, { rot: [s * 0.7, 0, 0.3] }));
      }
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.28 + Math.abs(Math.sin(t * 1.6 + i)) * 0.18;
        g.rotation.y = Math.sin(t * 0.7 + i) * 0.8;
      }
    };
  };

  BUILDERS['honeybee'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.2, c, 0, 0.9, 0, { scale: [1, 0.8, 1.25], seg: 18, roughness: 0.6 }));
    // stripes
    for (var i = 0; i < 3; i++) {
      var band = new (three()).Mesh(new (three()).TorusGeometry(0.16, 0.035, 8, 18), mat(cfg.stripe));
      band.rotation.x = Math.PI / 2;
      band.position.z = (i - 1) * 0.11;
      g.add(band);
    }
    // head + eyes
    g.add(sphere(0.13, 0x2a2a2a, 0.2, 0.92, 0, { seg: 14 }));
    g.add(eye(0.24, 0.96, 0.1, 0.05));
    g.add(eye(0.24, 0.96, -0.1, 0.05));
    g.add(cyl(0.01, 0.01, 0.14, 0x2a2a2a, 0.26, 1.04, 0.06, { rot: [0.3, 0, 0.5] }));
    g.add(cyl(0.01, 0.01, 0.14, 0x2a2a2a, 0.26, 1.04, -0.06, { rot: [-0.3, 0, 0.5] }));
    // wings
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var w = new (three()).Mesh(new (three()).PlaneGeometry(0.28, 0.16), mat(0xffffff, { transparent: true, opacity: 0.55, side: 2 }));
      w.position.set(0, 1.12, s * 0.13);
      w.rotation.z = s * 0.5;
      g.add(w); wings.push(w);
    }
    // legs
    for (var l = 0; l < 3; l++) {
      for (var s2 = -1; s2 <= 1; s2 += 2) {
        g.add(cyl(0.01, 0.01, 0.14, 0x2a2a2a, -0.06 + l * 0.08, 0.78, s2 * 0.13, { rot: [s2 * 0.6, 0, 0.3] }));
      }
    }
    return {
      group: g,
      anim: function (t, i) {
        wings.forEach(function (w, wi) { w.rotation.z = (wi ? 0.5 : -0.5) + Math.sin(t * 40 + i) * 0.6; });
        g.position.y = 0.9 + Math.sin(t * 1.6 + i) * 0.3;
        g.rotation.y = Math.sin(t * 0.8 + i) * 0.7;
      }
    };
  };

  BUILDERS['butterfly'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color, wingC = cfg.wing;
    g.add(cyl(0.035, 0.05, 0.4, 0x333333, 0, 0, 0, { rot: [0, 0, Math.PI / 2] }));
    // wings
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var w = new (three()).Group();
      var upper = new (three()).Mesh(new (three()).PlaneGeometry(0.4, 0.3), mat(wingC, { side: 2, roughness: 0.6 }));
      upper.position.set(0.2, 0.1, 0);
      var lower = new (three()).Mesh(new (three()).PlaneGeometry(0.26, 0.22), mat(c, { side: 2, roughness: 0.6 }));
      lower.position.set(0.14, -0.12, 0);
      w.add(upper); w.add(lower);
      // spots
      w.add(sphere(0.05, 0xffffff, 0.22, 0.12, 0.01, { scale: [1, 1, 0.2] }));
      w.position.set(0, 0, s * 0.02);
      w.rotation.y = Math.PI / 2;
      g.add(w); wings.push(w);
    }
    g.add(eye(0.2, 0.1, 0.06, 0.04));
    g.add(eye(0.2, 0.1, -0.06, 0.04));
    g.add(cyl(0.008, 0.008, 0.16, 0x333333, 0.28, 0.14, 0.04, { rot: [0.4, 0, 0.3] }));
    g.add(cyl(0.008, 0.008, 0.16, 0x333333, 0.28, 0.14, -0.04, { rot: [-0.4, 0, 0.3] }));
    return {
      group: g,
      anim: function (t, i) {
        wings.forEach(function (w, wi) { w.rotation.z = (wi ? 1 : -1) * (0.5 + Math.sin(t * 22 + i) * 0.5); });
        g.position.y = 1.4 + Math.sin(t * 1.3 + i) * 0.35;
        g.rotation.y = Math.sin(t * 0.5 + i) * 0.5;
      }
    };
  };

  BUILDERS['spider'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.16, c, 0, 0.28, 0, { scale: [1, 0.85, 1.1], seg: 16, roughness: 0.45 }));
    g.add(sphere(0.1, c, 0, 0.3, 0.18, { seg: 14 }));
    // 8 legs, jointed
    for (var k = 0; k < 8; k++) {
      var a = (k / 8) * Math.PI * 2;
      var leg = new (three()).Group();
      var upper = cyl(0.016, 0.014, 0.2, c, 0, -0.1, 0, { seg: 6 });
      var lower = cyl(0.013, 0.008, 0.24, c, 0, -0.3, 0, { seg: 6 });
      leg.add(upper); leg.add(lower);
      leg.position.set(Math.cos(a) * 0.09, 0.3, Math.sin(a) * 0.09);
      leg.rotation.z = -Math.cos(a) * 0.9;
      leg.rotation.x = Math.sin(a) * 0.9;
      g.add(leg);
    }
    // eyes
    for (var e = 0; e < 4; e++) {
      g.add(sphere(0.022, e < 2 ? 0xcc2222 : 0x111111, 0.06 - e * 0.03, 0.36, 0.08 - e * 0.05));
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.6 + Math.abs(Math.sin(t * 1.3 + i)) * 0.15;
        g.rotation.y = Math.sin(t * 0.5 + i) * 0.5;
      }
    };
  };

  BUILDERS['ant'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    g.add(sphere(0.11, c, -0.02, 0.16, 0, { scale: [1, 0.9, 1.3], seg: 14, roughness: 0.4 }));
    g.add(sphere(0.1, c, 0.12, 0.17, 0, { scale: [1, 0.95, 1.1], seg: 14, roughness: 0.4 }));
    g.add(sphere(0.08, c, 0.24, 0.18, 0, { seg: 12, roughness: 0.4 }));
    g.add(eye(0.28, 0.21, 0.06, 0.03));
    g.add(eye(0.28, 0.21, -0.06, 0.03));
    g.add(cyl(0.008, 0.008, 0.14, c, 0.3, 0.27, 0.05, { rot: [0.3, 0, 0.4] }));
    g.add(cyl(0.008, 0.008, 0.14, c, 0.3, 0.27, -0.05, { rot: [-0.3, 0, 0.4] }));
    // 6 legs
    for (var k = 0; k < 3; k++) {
      for (var s = -1; s <= 1; s += 2) {
        g.add(cyl(0.011, 0.008, 0.17, c, -0.06 + k * 0.09, 0.09, s * 0.1, { rot: [s * 0.7, 0, 0.25] }));
      }
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.2 + Math.abs(Math.sin(t * 2.2 + i)) * 0.1;
        g.rotation.y = Math.sin(t * 1.2 + i) * 1.2;
      }
    };
  };

  BUILDERS['caterpillar'] = function (cfg) {
    var g = new (three()).Group();
    var c = cfg.color;
    // segmented body
    for (var i = 0; i < 6; i++) {
      g.add(sphere(0.13 - i * 0.012, i % 2 ? c : cfg.stripe, (i - 2.5) * 0.16, 0.14, 0, { seg: 12, roughness: 0.75 }));
    }
    // head + antennae + legs
    g.add(sphere(0.14, c, 0.4, 0.16, 0, { seg: 12 }));
    g.add(eye(0.46, 0.2, 0.08, 0.045));
    g.add(eye(0.46, 0.2, -0.08, 0.045));
    g.add(cyl(0.008, 0.008, 0.16, c, 0.48, 0.3, 0.07, { rot: [0.3, 0, 0.3] }));
    g.add(cyl(0.008, 0.008, 0.16, c, 0.48, 0.3, -0.07, { rot: [-0.3, 0, 0.3] }));
    for (var l = 0; l < 4; l++) {
      for (var s = -1; s <= 1; s += 2) {
        g.add(cyl(0.01, 0.008, 0.12, c, -0.3 + l * 0.2, 0.06, s * 0.1, { rot: [s * 0.8, 0, 0] }));
      }
    }
    return {
      group: g,
      anim: function (t, i) {
        g.position.y = 0.3 + Math.abs(Math.sin(t * 2.4 + i)) * 0.12;
        g.rotation.y = Math.sin(t * 0.9 + i) * 0.9;
      }
    };
  };

  // ---------------- real glTF models ----------------
  var GLTFLoaderMod = null;
  var mixers = [];
  var clockRunning = false;
  var loaderReady = null;

  // Configure the loader with the Draco and Meshopt decoders so that
  // compressed .glb files (many of the real-world models) can be read.
  function getLoader() {
    if (loaderReady) return loaderReady;
    loaderReady = Promise.all([
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/libs/meshopt_decoder.module.js')
    ]).then(function (mods) {
      var loader = new mods[0].GLTFLoader();
      try {
        var draco = new mods[1].DRACOLoader();
        draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
        loader.setDRACOLoader(draco);
      } catch (e) { console.warn('ModelsLib: Draco decoder unavailable.', e); }
      try {
        loader.setMeshoptDecoder(mods[2].MeshoptDecoder);
      } catch (e) { console.warn('ModelsLib: Meshopt decoder unavailable.', e); }
      GLTFLoaderMod = mods[0].GLTFLoader;
      return loader;
    });
    return loaderReady;
  }

  function loadRealModel(url) {
    return getLoader().then(function (loader) {
      return loader.loadAsync(url);
    });
  }

  // tick every loaded animation on our own loop so apps need no extra wiring
  function startTicker() {
    if (clockRunning) return;
    clockRunning = true;
    var T = window.__THREE;
    var c = new T.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      var dt = c.getDelta();
      for (var i = 0; i < mixers.length; i++) mixers[i].update(dt);
    })();
  }

  function prep(gltf, obj) {
    var T = window.__THREE;
    obj.traverse(function (o) {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    if (gltf.animations && gltf.animations.length) {
      var mixer = new T.AnimationMixer(obj);
      gltf.animations.forEach(function (clip) {
        var a = mixer.clipAction(clip);
        a.play();
      });
      mixers.push(mixer);
      startTicker();
    }
  }

  /**
   * Place a model so that it sits on the ground (or at a given spot) and is
   * the requested height.  The bounds are measured *after* scaling, which
   * keeps the placement correct whatever the model's original pivot is.
   */
  function placeModel(obj, opts) {
    var T = window.__THREE;
    obj.updateWorldMatrix(true, true);
    var box = new T.Box3().setFromObject(obj);
    var h = (box.max.y - box.min.y) || 1;
    var d = (box.max.z - box.min.z) || 0;

    // Some models are authored Z-up (lying along the depth axis). If the
    // depth is clearly the long axis, stand it up first.
    if (opts.straighten !== false && d > h * 1.4) {
      obj.rotation.x -= Math.PI / 2;
      obj.updateWorldMatrix(true, true);
      box = new T.Box3().setFromObject(obj);
      h = (box.max.y - box.min.y) || 1;
    }

    if (opts.targetHeight) {
      var s = opts.targetHeight / h;
      obj.scale.multiplyScalar(s);
      obj.updateWorldMatrix(true, true);
      box = new T.Box3().setFromObject(obj);
    }
    var c = box.getCenter(new T.Vector3());
    var px = opts.position ? (opts.position.x || 0) : 0;
    var py = opts.position ? (opts.position.y || 0) : 0;
    var pz = opts.position ? (opts.position.z || 0) : 0;
    obj.position.x += px - c.x;
    obj.position.y += py - box.min.y;      // stand on the ground
    obj.position.z += pz - c.z;
    obj.updateWorldMatrix(true, true);
    return obj;
  }

  /**
   * Add a real, textured glTF model to the scene as a new object.
   * opts: { targetHeight, position:{x,y,z}, rotationY, scale, name }
   */
  function addReal(scene, url, opts) {
    opts = opts || {};
    return loadRealModel(url).then(function (gltf) {
      var T = window.__THREE;
      var obj = gltf.scene;
      prep(gltf, obj);
      var holder = new T.Group();
      holder.add(obj);
      if (opts.scale) obj.scale.setScalar(opts.scale);
      if (opts.rotationY != null) holder.rotation.y = opts.rotationY;
      holder.position.set(
        opts.position ? (opts.position.x || 0) : 0,
        opts.position ? (opts.position.y || 0) : 0,
        opts.position ? (opts.position.z || 0) : 0
      );
      scene.add(holder);
      // measure in world space, then keep the holder at the origin and move the model
      holder.position.set(0, 0, 0);
      placeModel(obj, {
        targetHeight: opts.targetHeight,
        position: {
          x: opts.position ? (opts.position.x || 0) : 0,
          y: opts.position ? (opts.position.y || 0) : 0,
          z: opts.position ? (opts.position.z || 0) : 0
        }
      });
      holder.name = opts.name || url.split('/').pop();
      return holder;
    }).catch(function (e) {
      console.warn('ModelsLib: could not load "' + url + '"', e);
      return null;
    });
  }

  /**
   * Replace a procedurally built group with a real, textured glTF model.
   */
  function useReal(scene, group, url, opts) {
    opts = opts || {};
    return loadRealModel(url).then(function (gltf) {
      var obj = gltf.scene;
      prep(gltf, obj);
      // swap: drop the procedural children, keep any UI label
      group.children.slice().forEach(function (ch) {
        if (!(ch.userData && ch.userData.isKidLabel)) group.remove(ch);
      });
      group.add(obj);
      placeModel(obj, {
        targetHeight: opts.targetHeight,
        position: { x: 0, y: opts.offsetY || 0, z: 0 }
      });
      if (opts.label) {
        opts.label.visible = true;
        // lift label above the real model height
        var h = opts.targetHeight || 2;
        opts.label.position.y = h + 0.9;
      }
      if (opts.onReady) opts.onReady(obj);
      return obj;
    }).catch(function (e) {
      console.warn('ModelsLib: real model failed to load (' + url + ') — keeping the built one.', e);
      return null;
    });
  }

  M.BUILDERS = BUILDERS;
  M.useReal = useReal;
  M.addReal = addReal;
  M.loadRealModel = loadRealModel;
  M.eye = eye; M.limb = limb; M.tail = tail;
  M.sphere = sphere; M.box = box; M.cyl = cyl; M.cone = cone; M.mat = mat;
  M.dinoBody = dinoBody; M.quadruped = quadruped;
  window.ModelsLib = M;
})();
