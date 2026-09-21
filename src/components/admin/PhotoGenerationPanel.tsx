"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Group, Product } from "@/lib/catalog/types";
import { buildSuggestedPhotoProductName } from "@/lib/catalog/photoProduct";
import { productPath } from "@/lib/catalog/urls";
import { PHOTO_ROLES, referenceUrl, type PhotoOutput, type PhotoWorkflow } from "@/lib/photos/types";

const roles = { main: "მთავარი", informative: "ინფორმაციული", detail: "დეტალი", additional: "დამატებითი" };
const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";
const button = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";
const primary = "rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40";

type Props = { groups: Group[]; categories: Category[]; products: Product[]; workflows: PhotoWorkflow[]; configured: boolean };
type ApiResult = { workflow?: PhotoWorkflow; workflows?: PhotoWorkflow[]; product?: Product; error?: string; duplicate?: boolean };

export default function PhotoGenerationPanel({ groups, categories, products, workflows, configured }: Props) {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState(products);
  const [sessions, setSessions] = useState(workflows);
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [name, setName] = useState("");
  const [workflow, setWorkflow] = useState<PhotoWorkflow | null>(null);
  const current = useRef<PhotoWorkflow | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saveMode, setSaveMode] = useState<"append" | "replace">("append");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [galleryOrder, setGalleryOrder] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const selectedProduct = localProducts.find(product => product.id === (workflow?.productId || productId));
  const selectedCategory = categories.find(category => category.id === (selectedProduct?.categoryId || categoryId));
  const group = groups.find(group => group.id === selectedCategory?.groupId);
  const productSessions = sessions.filter(session => session.productId === productId);
  const approvedOutputs = workflow?.outputs.filter(output => output.draft?.approved) || [];
  const approvedIds = new Set(approvedOutputs.map(output => output.id));
  const normalizedGalleryOrder = [
    ...galleryOrder.filter(id => approvedIds.has(id)),
    ...approvedOutputs.map(output => output.id).filter(id => !galleryOrder.includes(id)),
  ];
  const orderedApproved = normalizedGalleryOrder
    .map(id => approvedOutputs.find(output => output.id === id))
    .filter((output): output is PhotoOutput => Boolean(output));
  const approvedCount = approvedOutputs.length;
  const mainApproved = approvedOutputs.some(output => output.role === "main");
  const existingGalleryHasImages = Boolean(selectedProduct?.images.length);
  const mainRequiredForSave = saveMode === "replace" || !existingGalleryHasImages;
  const canSave = !dirty && Boolean(workflow?.planApproved) && approvedCount > 0 && (!mainRequiredForSave || mainApproved);

  function accept(next: PhotoWorkflow) {
    current.current = next;
    setWorkflow(next);
    setDirty(false);
    setSessions(items => [next, ...items.filter(item => item.id !== next.id)]);
    setGalleryOrder(order => {
      const approved = next.outputs.filter(output => output.draft?.approved);
      const ids = approved.map(output => output.id);
      const mainId = approved.find(output => output.role === "main")?.id;
      const kept = order.filter(id => ids.includes(id) && id !== mainId);
      const missing = ids.filter(id => id !== mainId && !kept.includes(id));
      return mainId ? [mainId, ...kept, ...missing] : [...kept, ...missing];
    });
  }

  async function request(url: string, body?: object | FormData): Promise<ApiResult> {
    const response = await fetch(url, body ? { method: "POST", ...(body instanceof FormData ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) } : { cache: "no-store" });
    const payload: ApiResult = await response.json();
    if (payload.workflow) accept(payload.workflow);
    if (payload.product) {
      const product = payload.product;
      setLocalProducts(items => [product, ...items.filter(item => item.id !== product.id)]);
      setProductId(product.id);
    }
    if (!response.ok) throw new Error(payload.error || "ოპერაცია ვერ დასრულდა.");
    return payload;
  }

  async function run(label: string, task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    setNotice("");
    try { await task(); }
    catch (error) { setError(error instanceof Error ? error.message : "ოპერაცია ვერ დასრულდა."); }
    finally { lock.current = false; setBusy(""); }
  }

  async function act(action: string, extra: object = {}) {
    const session = current.current;
    if (!session) throw new Error("ჯერ შექმენით სესია.");
    return request(`/api/admin/photo-workflows/${session.id}`, { action, revision: session.revision, ...extra });
  }

  function changeOutputs(outputs: PhotoOutput[]) {
    if (!workflow) return;
    setWorkflow({ ...workflow, outputs, planApproved: false });
    setDirty(true);
  }

  function editOutput(id: string, patch: Partial<PhotoOutput>) {
    if (!workflow) return;
    changeOutputs(workflow.outputs.map(output => output.id === id ? { ...output, ...patch, draft: undefined } : output));
  }

  function addOutput() {
    if (!workflow?.references.length) return;
    changeOutputs([...workflow.outputs, {
      id: crypto.randomUUID(),
      role: workflow.outputs.some(output => output.role === "main") ? "informative" : "main",
      title: "",
      reason: "",
      instruction: "",
      baseReferenceId: workflow.references[0].id,
      supportingReferenceIds: [],
      attempts: 0,
    }]);
  }

  function moveGalleryOutput(outputId: string, offset: -1 | 1) {
    if (!workflow) return;
    setGalleryOrder(order => {
      const approved = workflow.outputs.filter(output => output.draft?.approved);
      const ids = approved.map(output => output.id);
      const mainId = approved.find(output => output.role === "main")?.id;
      const kept = order.filter(id => ids.includes(id) && id !== mainId);
      const missing = ids.filter(id => id !== mainId && !kept.includes(id));
      const normalized = mainId ? [mainId, ...kept, ...missing] : [...kept, ...missing];
      const index = normalized.indexOf(outputId);
      const firstMovable = mainId ? 1 : 0;
      const target = index + offset;
      if (index < firstMovable || target < firstMovable || target >= normalized.length) return normalized;
      const next = [...normalized];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function upload(files: File[]) {
    if (!current.current || current.current.outputs.length) return;
    if (current.current.references.length + files.length > 10) throw new Error("ერთ სესიაში მაქსიმუმ 10 ფოტო ატვირთეთ.");
    let duplicates = 0;
    for (const [index, file] of files.entries()) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024) throw new Error(`${file.name}: დასაშვებია JPG, PNG ან WebP, მაქსიმუმ 20 MB.`);
      setBusy(`იტვირთება ${index + 1} / ${files.length}`);
      const form = new FormData();
      form.set("file", file);
      form.set("revision", String(current.current!.revision));
      const result = await request(`/api/admin/photo-workflows/${current.current!.id}`, form);
      if (result.duplicate) duplicates++;
    }
    setNotice(duplicates ? `ფოტოები შენახულია. ${duplicates} ზუსტი დუბლიკატი გამოტოვებულია.` : "ორიგინალი ფოტოები შენახულია.");
  }

  async function generate(outputId: string) {
    const session = current.current!;
    setChecked(values => ({ ...values, [outputId]: false }));
    await request("/api/admin/generate-photo", { workflowId: session.id, revision: session.revision, outputId, correction: corrections[outputId] || "" });
  }

  return <div className="space-y-6 pb-16">
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 md:grid-cols-4" aria-label="სამუშაო ეტაპები">
      {["01 · პროდუქტი და საწყისი ფოტოები", "02 · საჭირო კადრები", "03 · გენერაცია და შემოწმება", "04 · გალერეის რიგი და შენახვა"].map(step => <div key={step} className="rounded-lg border bg-white p-3">{step}</div>)}
    </div>

    {!configured && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">AI ჯერ არ არის ჩართული — სერვერზე საჭიროა OPENAI_API_KEY. მანამდე შეგიძლიათ ატვირთოთ ფოტოები და შეინახოთ გეგმა.</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} {workflow && <button className="underline" disabled={!!busy} onClick={() => run("იტვირთება სესია…", async () => { await request(`/api/admin/photo-workflows/${workflow.id}`); router.refresh(); })}>სესიის ხელახლა გახსნა</button>}</p>}
    <div role="status" aria-live="polite" className={busy || notice ? "rounded-xl bg-gray-100 p-4 text-sm" : "sr-only"}>{busy || notice}</div>

    <fieldset disabled={!!busy} className="space-y-6 disabled:opacity-80">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold">პროდუქტი</h2>
        <p className="mt-2 text-sm text-gray-600">ფოტოებზე მუშაობა ყოველთვის უკავშირდება პროდუქტს: აირჩიეთ არსებული პროდუქტი ან შექმენით ახალი გამოუქვეყნებელი მონახაზი.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">არსებული პროდუქტი
            <select className={field} value={productId} onChange={event => { setProductId(event.target.value); setWorkflow(null); current.current = null; setDirty(false); setError(""); setNotice(""); setChecked({}); setGalleryOrder([]); }}>
              <option value="">ახალი პროდუქტის შექმნა</option>
              {localProducts.map(product => <option key={product.id} value={product.id}>{product.code?.toUpperCase()} · {product.name.ka}</option>)}
            </select>
          </label>
          {productId ? <div className="space-y-2 text-sm"><p>შენახული ფოტოსესიები</p><select className={field} value={workflow?.id || ""} onChange={event => { if (event.target.value) run("იტვირთება სესია…", async () => { await request(`/api/admin/photo-workflows/${event.target.value}`); setChecked({}); }); }}><option value="">აირჩიეთ სესია</option>{productSessions.map(session => <option key={session.id} value={session.id}>{new Date(session.createdAt).toLocaleString("ka-GE")} · {session.references.length} ფოტო · {session.savedAt ? "შენახულია" : "მონახაზი"}</option>)}</select></div> : <>
            <label className="space-y-2 text-sm">კატეგორია<select className={field} value={categoryId} onChange={event => { setCategoryId(event.target.value); setName(""); }}>{groups.map(group => <optgroup key={group.id} label={group.name.ka}>{categories.filter(category => category.groupId === group.id).map(category => <option key={category.id} value={category.id}>{category.name.ka}</option>)}</optgroup>)}</select></label>
            <label className="space-y-2 text-sm md:col-span-2">პროდუქტის სახელი<input className={field} value={name} maxLength={200} placeholder={selectedCategory ? buildSuggestedPhotoProductName(selectedCategory, localProducts) : "სახელი"} onChange={event => setName(event.target.value)} /></label>
          </>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className={button} disabled={!productId && !selectedCategory} onClick={() => run("იქმნება სესია…", async () => { await request("/api/admin/photo-workflows", { productId: productId || undefined, categoryId, name: name.trim() || (selectedCategory ? buildSuggestedPhotoProductName(selectedCategory, localProducts) : ""), importOriginals: !!productId }); setChecked({}); setCorrections({}); setGalleryOrder([]); })}>{productId ? "ფოტოებზე მუშაობის ახალი სესია" : "ახალი პროდუქტის მონახაზის შექმნა"}</button>
          {selectedProduct && group && <span className="break-all font-mono text-xs text-gray-500">{productPath("ka", group.slug, selectedProduct)}</span>}
        </div>
        <p className="mt-3 text-xs text-gray-500">{productId ? "არსებული პროდუქტი არ იცვლება, სანამ დამტკიცებულ ფოტოებს გალერეაში არ შეინახავთ. თუ ძველი ორიგინალები არსებობს, ისინი ახალ სესიაში ხელმისაწვდომი იქნება." : "სახელი და კატეგორია საჭიროა პროდუქტის გამოუქვეყნებელი მონახაზის შესაქმნელად. დანარჩენი პროდუქტის ინფორმაცია მოგვიანებით შეივსება."}</p>
      </section>

      {workflow && <>
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">საწყისი ფოტოები</h2><span className="text-sm text-gray-500">{workflow.references.length} / 10</span></div>
          {!workflow.outputs.length && <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) run("იტვირთება ფოტოები…", () => upload(Array.from(event.dataTransfer.files))); }} className="mb-5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="mb-2 text-sm">ჩამოაგდეთ ერთი პროდუქტის 2–10 ფოტო</p><p className="mb-4 text-xs text-gray-500">ნებისმიერი ორიენტაცია · JPG, PNG, WebP · მაქსიმუმ 20 MB თითო ფოტო · ორიგინალი არ იჭრება</p>
            <button className={button} onClick={() => input.current?.click()}>ფოტოების არჩევა</button><input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="საწყისი ფოტოების ატვირთვა" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; run("იტვირთება ფოტოები…", () => upload(files)); }} />
          </div>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">{workflow.references.map((reference, index) => <div key={reference.id} className="overflow-hidden rounded-xl border border-gray-200">
            <a href={referenceUrl(workflow.id, reference.filename)} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] bg-gray-50"><Image fill unoptimized src={referenceUrl(workflow.id, reference.filename)} alt={`საწყისი ფოტო ${index + 1}`} className="object-contain" /></a>
            <div className="p-3"><p className="truncate text-xs" title={reference.originalName}>{index + 1}. {reference.originalName}</p><p className="mt-1 text-[11px] text-gray-400">{reference.width} × {reference.height}</p>
            {!workflow.outputs.length && <div className="mt-2 text-xs"><button className="text-red-600" onClick={() => run("იშლება სიიდან…", async () => { await act("references", { referenceIds: workflow.references.filter(ref => ref.id !== reference.id).map(ref => ref.id) }); })}>ამოღება</button></div>}</div>
          </div>)}</div>
          <p className="mt-3 text-xs text-gray-500">საწყისი ფოტოების ატვირთვის რიგი პრიორიტეტს ან საბოლოო გალერეის რიგს არ განსაზღვრავს.</p>
          <div className="mt-5 flex flex-wrap gap-3"><button className={primary} disabled={!configured || workflow.references.length < 2 || workflow.outputs.some(output => output.draft)} onClick={() => run("მიმდინარეობს სრული ნაკრების ანალიზი…", async () => { await act("analyze"); })}>ფოტოების ანალიზი და გეგმის შეთავაზება</button>{!workflow.outputs.length && <button className={button} disabled={workflow.references.length < 2} onClick={addOutput}>გეგმის ხელით შედგენა</button>}</div>
        </section>

        {workflow.outputs.length > 0 && <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold">საჭირო კადრები</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">{workflow.summary || "აირჩიეთ მხოლოდ ის კადრები, რომლებიც მყიდველს ახალ ინფორმაციას აძლევს."}</p>
          {workflow.warnings.length > 0 && <ul className="mt-4 list-disc space-y-2 rounded-xl bg-amber-50 p-5 pl-8 text-sm text-amber-900">{workflow.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
          <p className="mt-4 text-xs text-gray-500">როლი აღწერს კადრის ფუნქციას და არა მის ადგილს გალერეაში. ერთი მთავარი კადრი აუცილებელია; საბოლოო გალერეის რიგს შენახვის ეტაპზე განსაზღვრავთ.</p>
          <div className="mt-5 space-y-4">{workflow.outputs.map((output, index) => <article key={output.id} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-gray-500">გეგმის კადრი {index + 1}</span><button className="text-xs text-red-600" onClick={() => changeOutputs(workflow.outputs.filter(item => item.id !== output.id))}>ამოღება</button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-xs">როლი<select className={field} value={output.role} onChange={event => editOutput(output.id, { role: event.target.value as PhotoOutput["role"] })}>{PHOTO_ROLES.map(role => <option key={role} value={role}>{roles[role]}</option>)}</select></label>
              <label className="space-y-1 text-xs md:col-span-2">კადრის სახელი<input className={field} maxLength={200} value={output.title} onChange={event => editOutput(output.id, { title: event.target.value })} placeholder="მაგ. გახსნილი შიდა ნაწილი" /></label>
              <label className="space-y-1 text-xs">ძირითადი ფოტო<select className={field} value={output.baseReferenceId} onChange={event => editOutput(output.id, { baseReferenceId: event.target.value, supportingReferenceIds: output.supportingReferenceIds.filter(id => id !== event.target.value) })}>{workflow.references.map((ref, index) => <option key={ref.id} value={ref.id}>{index + 1}. {ref.originalName}</option>)}</select></label>
              <div className="md:col-span-2"><p className="mb-2 text-xs">დამხმარე ფოტოები (მაქს. 3)</p><div className="flex flex-wrap gap-3">{workflow.references.filter(ref => ref.id !== output.baseReferenceId).map(ref => <label key={ref.id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={output.supportingReferenceIds.includes(ref.id)} disabled={!output.supportingReferenceIds.includes(ref.id) && output.supportingReferenceIds.length >= 3} onChange={event => editOutput(output.id, { supportingReferenceIds: event.target.checked ? [...output.supportingReferenceIds, ref.id] : output.supportingReferenceIds.filter(id => id !== ref.id) })} />ფოტო {workflow.references.findIndex(item => item.id === ref.id) + 1}</label>)}</div></div>
              <label className="space-y-1 text-xs md:col-span-3">დამატებითი მითითება<textarea className={field} maxLength={1500} rows={2} value={output.instruction} onChange={event => editOutput(output.id, { instruction: event.target.value })} /></label>
            </div>{output.reason && <p className="mt-3 text-xs leading-relaxed text-gray-500">{output.reason}</p>}
          </article>)}</div>
          <div className="mt-5 flex flex-wrap gap-3"><button className={button} disabled={workflow.outputs.length >= 8} onClick={addOutput}>+ კადრის დამატება</button><button className={button} onClick={() => run("ინახება გეგმა…", async () => { await act("plan", { outputs: workflow.outputs, approve: false }); setNotice("გეგმა შენახულია."); })}>გეგმის შენახვა</button><button className={primary} onClick={() => run("მტკიცდება გეგმა…", async () => { await act("plan", { outputs: workflow.outputs, approve: true }); setNotice("გეგმა დამტკიცებულია. შეგიძლიათ დაიწყოთ გენერაცია."); })}>{workflow.planApproved && !dirty ? "გეგმა დამტკიცებულია ✓" : "გეგმის დამტკიცება"}</button></div>
          {dirty && <p className="mt-3 text-xs text-amber-700">ცვლილებები ჯერ არ შენახულა. შეცვლილ კადრს ხელახლა გენერაცია და შემოწმება დასჭირდება.</p>}
        </section>}

        {workflow.planApproved && !dirty && <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">შედეგების შემოწმება</h2><button className={primary} disabled={!configured || workflow.outputs.every(output => output.draft)} onClick={() => run("იწყება გენერაცია…", async () => { for (const output of current.current!.outputs.filter(item => !item.draft)) { setBusy(`მზადდება: ${output.title}`); await generate(output.id); } })}>დარჩენილი კადრების გენერაცია</button></div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">შეადარეთ შედეგი ორიგინალს. გადაამოწმეთ ყოველი ქართული ასო, ლოგო, პროპორციები, სისქე, ჯიბეები და ნაკერები. დასამტკიცებლად გახსენით ფოტო სრული ზომით.</p>
          <div className="mt-6 space-y-8">{workflow.outputs.map(output => {
            const reference = workflow.references.find(ref => ref.id === output.baseReferenceId)!;
            return <article key={output.id} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex justify-between gap-3"><h3 className="font-semibold">{output.title}</h3><span className="text-xs text-gray-500">{roles[output.role]} · {output.draft?.approved ? "დამტკიცებულია ✓" : "შესამოწმებელია"}</span></div>
              <div className="grid gap-3 sm:grid-cols-2">{[{ label: "საწყისი ფოტო", filename: reference.filename }, { label: "მონახაზი", filename: output.draft?.filename }].map(item => <div key={item.label}><p className="mb-2 text-xs text-gray-500">{item.label}</p>{item.filename ? <a className="relative block aspect-square rounded-lg bg-gray-50" href={referenceUrl(workflow.id, item.filename)} target="_blank" rel="noreferrer"><Image fill unoptimized src={referenceUrl(workflow.id, item.filename)} alt={`${output.title} — ${item.label}`} className="object-contain" /></a> : <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">კადრი ჯერ არ შექმნილა</div>}</div>)}</div>
              {output.error && <p className="mt-3 text-sm text-red-700">{output.error}</p>}
              <label className="mt-4 block space-y-1 text-xs">შესწორება ხელახალი გენერაციისთვის<input className={field} maxLength={1500} placeholder="მაგ. ლოგო ზუსტად შეინარჩუნე" value={corrections[output.id] || ""} onChange={event => setCorrections(values => ({ ...values, [output.id]: event.target.value }))} /></label>
              {output.draft && !output.draft.approved && <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={checked[output.id] || false} onChange={event => setChecked(values => ({ ...values, [output.id]: event.target.checked }))} />შევამოწმე წარწერები, ლოგო და პროდუქტის კონსტრუქცია.</label>}
              <div className="mt-4 flex flex-wrap gap-3"><button className={button} disabled={!configured} onClick={() => run(`მზადდება: ${output.title}`, () => generate(output.id))}>{output.draft ? "ხელახლა გენერაცია" : "კადრის გენერაცია"}</button>{output.draft && <button className={primary} disabled={!output.draft.approved && !checked[output.id]} onClick={() => run("ინახება შეფასება…", async () => { await act("review", { outputId: output.id, approved: !output.draft!.approved }); })}>{output.draft.approved ? "დამტკიცების გაუქმება" : "კადრის დამტკიცება"}</button>}<button className={button} onClick={() => run("კადრი ამოღებულია…", async () => { await act("plan", { outputs: workflow.outputs.filter(item => item.id !== output.id), approve: true }); })}>კადრის ამოღება</button></div>
              {output.draft && <p className="mt-3 text-xs text-gray-400">მცდელობა {output.attempts} · {new Date(output.draft.provenance.generatedAt).toLocaleString("ka-GE")}</p>}
            </article>;
          })}</div>
        </section>}

        {workflow.outputs.some(output => output.draft) && <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold">გალერეის რიგი და შენახვა</h2>
          <p className="mt-2 text-sm text-gray-500">დამტკიცებულია {approvedCount} კადრი. მხოლოდ დამტკიცებული შედეგები შეინახება.</p>
          {mainRequiredForSave && approvedCount > 0 && !mainApproved && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">შენახვისთვის ჯერ დაამტკიცეთ მთავარი კადრი. მთავარი აუცილებელია ახალ პროდუქტზე და გალერეის სრული ჩანაცვლებისას.</p>}

          {orderedApproved.length > 0 && <div className="mt-5 max-w-2xl space-y-2">
            <div><h3 className="text-sm font-medium">დამტკიცებული კადრების რიგი</h3><p className="mt-1 text-xs text-gray-500">მთავარი კადრი ფიქსირებულია პირველ ადგილზე. დანარჩენი კადრები დაალაგეთ ისე, როგორც მომხმარებელმა უნდა ნახოს.</p></div>
            {orderedApproved.map((output, index) => <div key={output.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
              {output.draft && <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50"><Image fill unoptimized src={referenceUrl(workflow.id, output.draft.filename)} alt="" className="object-contain" /></div>}
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{index + 1}. {output.title}</p><p className="text-xs text-gray-500">{roles[output.role]}{output.role === "main" ? " · პირველი ადგილი ფიქსირებულია" : ""}</p></div>
              {output.role !== "main" && <div className="flex gap-2 text-xs"><button className={button} disabled={index <= 1} onClick={() => moveGalleryOutput(output.id, -1)}>↑</button><button className={button} disabled={index === orderedApproved.length - 1} onClick={() => moveGalleryOutput(output.id, 1)}>↓</button></div>}
            </div>)}
          </div>}

          <label className="mt-5 block max-w-lg space-y-2 text-sm">შენახვის რეჟიმი<select className={field} value={saveMode} onChange={event => { setSaveMode(event.target.value as "append" | "replace"); setReplaceConfirmed(false); }}><option value="append">არსებულ გალერეაში დამატება</option><option value="replace">არსებული გალერეის ჩანაცვლება</option></select></label>
          {saveMode === "append" && existingGalleryHasImages && <p className="mt-2 text-xs text-gray-500">არსებული ფოტოები და მათი რიგი უცვლელი დარჩება; ახალი დამტკიცებული კადრები მათ შემდეგ დაემატება ქვემოთ არჩეული რიგით.</p>}
          {saveMode === "replace" && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={replaceConfirmed} onChange={event => setReplaceConfirmed(event.target.checked)} />გალერეა შეიცვალოს დამტკიცებული კადრებით ({selectedProduct?.images.length || 0} არსებული ფოტო).</label>}
          <button className={`${primary} mt-4`} disabled={!canSave || (saveMode === "replace" && !replaceConfirmed) || !!workflow.savedAt} onClick={() => run("ინახება გალერეა…", async () => { await act("save", { mode: saveMode, expectedUpdatedAt: selectedProduct?.updatedAt, orderedOutputIds: orderedApproved.map(output => output.id) }); setNotice("დამტკიცებული ფოტოები გალერეაში შენახულია. გამოქვეყნების სტატუსი შენარჩუნებულია."); router.refresh(); })}>{workflow.savedAt ? "გალერეაში შენახულია ✓" : `${approvedCount} დამტკიცებული კადრის შენახვა`}</button>
          <Link href="/admin/products" className="ml-4 inline-block text-sm underline">პროდუქტების მართვა</Link>
          <p className="mt-3 text-xs text-gray-500">გამოქვეყნებული პროდუქტის გალერეის ცვლილება საიტზეც გამოჩნდება. მონახაზი გამოუქვეყნებელი რჩება. საწყისი ფოტოები ყოველთვის ინახება ცალკე.</p>
        </section>}
      </>}
    </fieldset>
  </div>;
}
