/* eslint-disable @typescript-eslint/no-require-imports -- This test harness intercepts CommonJS loading to isolate real server handlers. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const ts = require('typescript');
const sharp = require('sharp');
sharp.cache(false);
const repo = path.resolve(__dirname, '..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'kokeni-photo-test-'));
const originalCwd = process.cwd();
let authenticated = true;
let providerFailure = false;
let analyzedReferences = [];
let editInputs = [];
let generatedImage;
// Execute actual route and storage code in an isolated data directory. Only auth,
// Next cache invalidation and the external paid AI service are replaced.
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {};
  if (id === '@/lib/admin/auth' || id === '../admin/auth') return { isAdminAuthenticated: async () => authenticated };
  if (id === 'next/cache') return { revalidatePath() { }, unstable_noStore() { } };
  if (id.startsWith('@/')) id = path.join(repo, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
Module._extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
process.chdir(sandbox);
process.env.OPENAI_API_KEY = 'test-only-key';
const originalFetch = global.fetch;
global.fetch = async (url, init) => {
  if (providerFailure) return new Response('{}', { status: 429 });
  if (url.endsWith('/responses')) {
    const request = JSON.parse(init.body);
    assert.equal(request.store, false);
    analyzedReferences = request.input[0].content.filter(item => item.type === 'input_text' && item.text.startsWith('Reference ID:')).map(item => item.text.split(';')[0].slice(14));
    const result = {
      summary: 'სატესტო მოცულობითი პროდუქტი',
      warnings: ['შეამოწმეთ ქართული წარწერა'],
      geometry: 'volumetric',
      references: [
        {
          referenceId: analyzedReferences[0],
          state: 'closed',
          view: 'three_quarter',
          identityStrength: 'high',
          informationValue: 'high',
          publishable: true,
          measurementOnly: false,
          brandingVisible: true,
          interiorVisible: false,
          constructionVisible: true,
          notes: 'ძლიერი დახურული 3/4 ხედი',
        },
        {
          referenceId: analyzedReferences[1],
          state: 'open',
          view: 'top',
          identityStrength: 'medium',
          informationValue: 'high',
          publishable: true,
          measurementOnly: false,
          brandingVisible: false,
          interiorVisible: true,
          constructionVisible: true,
          notes: 'ღია ინტერიერი',
        },
        {
          referenceId: analyzedReferences[2],
          state: 'other',
          view: 'side',
          identityStrength: 'low',
          informationValue: 'medium',
          publishable: false,
          measurementOnly: true,
          brandingVisible: false,
          interiorVisible: false,
          constructionVisible: true,
          notes: 'საზომი reference',
        },
      ],
    };
    return Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(result) }] }], usage: { input_tokens: 42 } });
  }
  assert.ok(url.endsWith('/images/edits'));
  editInputs = init.body.getAll('image[]');
  assert.equal(init.body.get('model'), 'gpt-image-2.5-sunburst');
  assert.equal(init.body.get('size'), '1600x1600');
  assert.match(init.body.get('prompt'), /FIRST image/);
  return Response.json({ data: [{ b64_json: generatedImage.toString('base64') }], usage: { input_tokens: 12, output_tokens: 24 } });
};
const catalog = require(path.join(repo, 'src/lib/catalog/data.ts'));
const urls = require(path.join(repo, 'src/lib/catalog/urls.ts'));
const types = require(path.join(repo, 'src/lib/photos/types.ts'));
const store = require(path.join(repo, 'src/lib/photos/store.ts'));
const createRoute = require(path.join(repo, 'src/app/api/admin/photo-workflows/route.ts'));
const workflowRoute = require(path.join(repo, 'src/app/api/admin/photo-workflows/[id]/route.ts'));
const generateRoute = require(path.join(repo, 'src/app/api/admin/generate-photo/route.ts'));
const assetRoute = require(path.join(repo, 'src/app/api/admin/photo-workflows/[id]/assets/[filename]/route.ts'));
const productPage = require(path.join(repo, 'src/lib/catalog/productPage.ts'));
const stamp = '2026-01-01T00:00:00.000Z';
const category = { id: 'category-1', groupId: 'group-1', slug: 'diploma-cover', order: 1, name: { ka: 'დიპლომის ყდა' }, isActive: true, createdAt: stamp, updatedAt: stamp };
const initialProduct = { id: 'product-1', slug: 'დიპლომი-001', categoryId: category.id, order: 1, name: { ka: 'დიპლომი' }, shortDescription: { ka: 'ყდა' }, images: [], isPublished: true, price: { mode: 'contact' }, createdAt: stamp, updatedAt: stamp };
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
for (const [name, value] of Object.entries({ groups: [{ id: 'group-1', slug: 'academic', order: 1, name: { ka: 'აკადემიური' }, isActive: true, createdAt: stamp, updatedAt: stamp }], categories: [category], products: [initialProduct] })) fs.writeFileSync(path.join(sandbox, 'data', name + '.json'), JSON.stringify(value));
const jsonRequest = (url, body) => new Request('http://localhost' + url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const context = id => ({ params: Promise.resolve({ id }) });
async function mutation(workflow, action, extra = {}) { return workflowRoute.POST(jsonRequest('/api/admin/photo-workflows/' + workflow.id, { revision: workflow.revision, action, ...extra }), context(workflow.id)); }
after(async () => { global.fetch = originalFetch; Module._load = originalLoad; process.chdir(originalCwd); assert.equal(path.dirname(path.resolve(sandbox)), path.resolve(os.tmpdir())); assert.ok(path.basename(sandbox).startsWith('kokeni-photo-test-')); await fsp.rm(sandbox, { recursive: true, force: true }); });

test('photo workflow, URL migration and publication boundaries', async t => {
  let product, workflow;
  generatedImage = await sharp({ create: { width: 128, height: 128, channels: 3, background: '#eee' } }).png().toBuffer();
  await t.test('migration is backed up, ASCII-only, stable and resolves legacy aliases', async () => {
    const snapshot = await catalog.getCatalogSnapshot(); product = snapshot.products[0];
    assert.equal(product.code, 'kkn-dc-001'); assert.deepEqual(product.legacySlugs, ['დიპლომი-001']);
    assert.equal(urls.productPath('ka', { slug: 'diploma-cover' }, product), '/ka/catalog/diploma-cover/kkn-dc-001');
    assert.equal(urls.sectorPath('en', { slug: 'academic' }), '/en/catalog/sector/academic');
    assert.match(urls.asciiSlug('ოფიციალური დოკუმენტი'), /^[a-z-]+$/);
    assert.ok(fs.existsSync(path.join(sandbox, 'data/backups/before-product-url-migration.json')));
    assert.equal((await productPage.findPublicProduct('დიპლომი-001')).product.id, product.id);
    assert.equal((await catalog.getCatalogSnapshot()).products[0].code, product.code);
  });
  await t.test('concurrent creation allocates distinct codes; rename and deletion do not reuse codes', async () => {
    const input = { categoryId: category.id, nameKa: 'ყდა', shortDescriptionKa: 'სატესტო', priceMode: 'contact', isPublished: false, imagesJson: '[]' };
    const created = await Promise.all(Array.from({ length: 4 }, () => catalog.createProductRecord(input)));
    assert.equal(new Set(created.map(item => item.code)).size, 4);
    const highest = created.sort((a, b) => b.code.localeCompare(a.code))[0];
    await catalog.updateProductRecord({ ...input, id: product.id, order: 1, nameKa: 'სახელი შეიცვალა', isPublished: true });
    product = (await catalog.getCatalogSnapshot()).products.find(item => item.id === product.id);
    assert.equal(product.code, 'kkn-dc-001');
    await catalog.deleteProductRecord(highest.id);
    const next = await catalog.createProductRecord(input);
    assert.ok(next.code > highest.code);
    assert.equal(await productPage.findPublicProduct(next.code), null);
  });
  await t.test('API authentication and same-origin checks precede mutations', async () => {
    authenticated = false;
    assert.equal((await createRoute.POST(jsonRequest('/api/admin/photo-workflows', { productId: product.id }))).status, 401);
    authenticated = true;
    const request = jsonRequest('/api/admin/photo-workflows', { productId: product.id }); request.headers.set('origin', 'https://other.example');
    assert.equal((await createRoute.POST(request)).status, 403);
  });
  await t.test('references preserve exact bytes, dimensions and duplicates; reject bad files', async () => {
    const response = await createRoute.POST(jsonRequest('/api/admin/photo-workflows', { productId: product.id }));
    assert.equal(response.status, 201); workflow = (await response.json()).workflow;
    for (let index = 0; index < 3; index++) {
      const source = await sharp({ create: { width: 100 + index, height: 240, channels: 3, background: index ? '#223344' : '#887766' } }).jpeg().toBuffer();
      const form = new FormData(); form.set('revision', String(workflow.revision)); form.set('file', new Blob([source], { type: 'image/jpeg' }), 'portrait.jpg');
      const upload = await workflowRoute.POST(new Request('http://localhost/api/admin/photo-workflows/' + workflow.id, { method: 'POST', body: form }), context(workflow.id));
      assert.equal(upload.status, 200); workflow = (await upload.json()).workflow;
      const ref = workflow.references.at(-1); assert.equal(ref.width, 100 + index); assert.equal(ref.height, 240);
      assert.deepEqual(await fsp.readFile(store.assetPath(workflow.id, ref.filename)), source);
      form.set('revision', String(workflow.revision));
      const duplicate = await workflowRoute.POST(new Request('http://localhost/api/admin/photo-workflows/' + workflow.id, { method: 'POST', body: form }), context(workflow.id));
      assert.equal((await duplicate.json()).duplicate, true);
    }
    await assert.rejects(store.storeReference(workflow, Buffer.from('not-an-image'), 'x.jpg'));
    assert.throws(() => store.assetPath(workflow.id, '../../secret'));
  });
  await t.test('analysis sees the whole set, plan validates references and main role', async () => {
    const response = await mutation(workflow, 'analyze'); assert.equal(response.status, 200); workflow = (await response.json()).workflow;
    assert.equal(analyzedReferences.length, 3); assert.equal(workflow.outputs.length, 2); assert.equal(workflow.planApproved, false);
    assert.throws(() => types.validatePlan(workflow.outputs.map(item => ({ ...item, role: 'detail' })), workflow.references));
    assert.throws(() => types.validatePlan([{ ...workflow.outputs[0], baseReferenceId: 'outside-session' }], workflow.references));
    const plan = await mutation(workflow, 'plan', { outputs: workflow.outputs, approve: true }); assert.equal(plan.status, 200); workflow = (await plan.json()).workflow;
    const stale = await mutation({ ...workflow, revision: workflow.revision - 1 }, 'review', { outputId: workflow.outputs[0].id, approved: true }); assert.equal(stale.status, 409);
  });
  await t.test('generation uses only selected references and never publishes; failures retain drafts', async () => {
    const request = () => jsonRequest('/api/admin/generate-photo', { workflowId: workflow.id, revision: workflow.revision, outputId: workflow.outputs[0].id });
    let response = await generateRoute.POST(request()); assert.equal(response.status, 200); workflow = (await response.json()).workflow;
    assert.equal(editInputs.length, 1);
    assert.equal(
      editInputs[0].name,
      workflow.outputs[0].baseReferenceId + '.png'
    );
    const originalDraft = workflow.outputs[0].draft; assert.equal(originalDraft.approved, false);
    assert.equal((await catalog.getCatalogSnapshot()).products.find(item => item.id === product.id).images.length, 0);
    assert.equal(workflow.history.length, 1);
    providerFailure = true; response = await generateRoute.POST(request()); providerFailure = false;
    assert.equal(response.status, 502); workflow = (await response.json()).workflow;
    assert.equal(workflow.outputs[0].draft.filename, originalDraft.filename); assert.equal(workflow.history.length, 2);
    const unapproved = await mutation(workflow, 'save', { mode: 'replace', expectedUpdatedAt: product.updatedAt }); assert.equal(unapproved.status, 400);
    authenticated = false;
    const denied = await assetRoute.GET(new Request('http://localhost/asset'), { params: Promise.resolve({ id: workflow.id, filename: originalDraft.filename }) }); assert.equal(denied.status, 401); authenticated = true;
  });
  await t.test('review gates gallery save, writes two derivatives and keeps publication status', async () => {
    const review = await mutation(workflow, 'review', { outputId: workflow.outputs[0].id, approved: true }); workflow = (await review.json()).workflow;
    let response = await mutation(workflow, 'save', { mode: 'replace', expectedUpdatedAt: product.updatedAt }); assert.equal(response.status, 200);
    let saved = await response.json(); workflow = saved.workflow; product = saved.product;
    assert.equal(product.images.length, 1); assert.equal(product.isPublished, true); assert.equal(product.images[0].role, 'main');
    assert.equal(product.images[0].provenance.provider, 'openai');
    const filename = path.basename(product.images[0].src);
    for (const [name, width] of [[filename, 1600], [filename.replace('.webp', '-mobile.webp'), 800]]) assert.equal((await sharp(path.join(sandbox, 'public/uploads/products', name)).metadata()).width, width);
    response = await mutation(workflow, 'save', { mode: 'append', expectedUpdatedAt: product.updatedAt }); assert.equal(response.status, 200); saved = await response.json(); workflow = saved.workflow; product = saved.product;
    assert.equal(product.images.length, 1); assert.equal(product.images[0].role, 'main');
    const stale = await mutation(workflow, 'save', { mode: 'replace', expectedUpdatedAt: stamp }); assert.equal(stale.status, 409);
    assert.equal((await store.readWorkflow(workflow.id)).references.length, 3);
  });
  await t.test('changing a plan invalidates the affected approval and generation requires renewed plan approval', async () => {
    const outputs = workflow.outputs.map((item, index) => index ? item : { ...item, instruction: 'Different framing' });
    const changed = await mutation(workflow, 'plan', { outputs, approve: false }); workflow = (await changed.json()).workflow;
    assert.equal(workflow.outputs[0].draft, undefined);
    const response = await generateRoute.POST(jsonRequest('/api/admin/generate-photo', { workflowId: workflow.id, revision: workflow.revision, outputId: workflow.outputs[0].id })); assert.equal(response.status, 400);
  });
});
