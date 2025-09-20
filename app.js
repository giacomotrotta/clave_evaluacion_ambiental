
(async function(){
  const $ = sel => document.querySelector(sel);
  const view = $("#view");
  const actions = $("#actions");

  const [keyDef, speciesList] = await Promise.all([
    fetch("key.json").then(r=>r.json()),
    fetch("species.json").then(r=>r.json())
  ]);
  const speciesMap = Object.fromEntries(speciesList.map(s=>[s.id, s]));

  const stack = ["home"];
  let path = [keyDef.root];
  let fromListToDetail = false;

  const currentNode = () => keyDef.nodes.find(n=>n.id===path[path.length-1]);

  function push(v){ stack.push(v); render(); }
  function pop(){ if(stack.length>1){ stack.pop(); render(); } }

  function button(label, onclick, outlined=false){
    const b = document.createElement("button");
    b.className = "btn" + (outlined?" outlined":"");
    b.textContent = label;
    b.onclick = onclick;
    return b;
  }
  function clear(){ view.innerHTML=""; actions.innerHTML=""; }

  function home(){
    clear();
    const box = document.createElement("div"); box.className="card";
    const title = document.createElement("div"); title.className="title"; title.textContent="Inicio";
    const p = document.createElement("div"); p.className="caption"; p.textContent="Elige cómo empezar:";
    box.appendChild(title); box.appendChild(p); view.appendChild(box);
    actions.appendChild(button("Identificar", ()=>{ path=[keyDef.root]; push("identify"); }));
    actions.appendChild(button("Lista de especies", ()=> push("list"), true));
  }

  function identify(){
    clear();
    const n = currentNode();
    const box = document.createElement("div"); box.className="card";
    const q = document.createElement("div"); q.className="title"; q.textContent = n?.prompt || "Elige una opción";
    box.appendChild(q);

    if(n && n.options && n.options.length){
      n.options.forEach(opt=>{
        const label = opt.label + (opt.speciesId ? (" → " + (speciesMap[opt.speciesId]?.scientificName||"")) : "");
        const b = button(label, ()=>{
          if(opt.speciesId){ fromListToDetail=false; push({type:"detail", id: opt.speciesId}); }
          else if(opt.next){ path = [...path, opt.next]; identify(); }
        });
        box.appendChild(b);
      });
    } else {
      const t = document.createElement("div"); t.className="caption"; t.textContent="Nodo sin opciones."; box.appendChild(t);
    }
    view.appendChild(box);
    actions.appendChild(button("Inicio", ()=>{ stack.splice(0, stack.length, "home"); render(); }, true));
    actions.appendChild(button("Atrás", ()=>{ if(path.length>1){ path = path.slice(0,-1); identify(); } else { pop(); } }, true));
    actions.appendChild(button("Reiniciar", ()=>{ path=[keyDef.root]; identify(); }, true));
  }

  function list(){
    clear();
    const box = document.createElement("div"); box.className="card";
    const title = document.createElement("div"); title.className="title"; title.textContent="Especies";
    box.appendChild(title);

    const cont = document.createElement("div"); cont.className="list";
    speciesList.slice().sort((a,b)=>a.scientificName.localeCompare(b.scientificName)).forEach(sp=>{
      const b = button(sp.scientificName, ()=>{ fromListToDetail=true; push({type:"detail", id: sp.id}); }, true);
      cont.appendChild(b);
    });
    box.appendChild(cont); view.appendChild(box);
    actions.appendChild(button("Atrás", ()=>pop(), true));
  }

  function detail(spId){
    clear();
    const sp = speciesMap[spId];
    const box = document.createElement("div"); box.className="card";
    const title = document.createElement("div"); title.className="title"; title.textContent= sp?.scientificName || "Especie";
    box.appendChild(title);
    const img = document.createElement("img"); img.className="spec-img";
    img.src = "images/" + (sp?.imageResName || "placeholder") + ".webp"; img.onerror = ()=>{ img.src="images/placeholder.webp"; };
    box.appendChild(img);
    const d = document.createElement("div"); d.className="caption"; d.textContent = sp?.description || ""; box.appendChild(d);
    view.appendChild(box);
    actions.appendChild(button("Atrás", ()=>{ pop(); }, true));
    actions.appendChild(button("Reiniciar clave", ()=>{ path=[keyDef.root]; stack.splice(0, stack.length, "home","identify"); render(); }, true));
  }

  function render(){
    const top = stack[stack.length-1];
    if(top==="home") home();
    else if(top==="identify") identify();
    else if(top==="list") list();
    else if(typeof top==="object" && top.type==="detail") detail(top.id);
  }
  render();

  if("serviceWorker" in navigator){ try{ navigator.serviceWorker.register("./sw.js"); }catch(e){} }
})();
