/**
 * AsadoPy verification script — drives the live dev server at localhost:3000
 * and exercises all major user flows end-to-end.
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { resolve } from 'path'

const BASE = 'http://localhost:3000'
const SHOTS = resolve('verify-screenshots')
await mkdir(SHOTS, { recursive: true })

let pass = 0, fail = 0, warn = 0
const findings = []

function log(icon, msg) { console.log(`${icon} ${msg}`) }
function ok(msg)   { pass++; log('✅', msg) }
function ng(msg)   { fail++; log('❌', msg); findings.push({ level: 'FAIL', msg }) }
function probe(msg){ log('🔍', msg) }
function note(msg) { warn++; log('⚠️ ', msg); findings.push({ level: 'WARN', msg }) }

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },  // iPhone 14 Pro size
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  locale: 'es-PY',
})
const page = await ctx.newPage()

// Capture console errors
const consoleErrors = []
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', err => consoleErrors.push(err.message))

async function shot(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })
}

// ─── 1. HOME PAGE LOADS ──────────────────────────────────────────────────────
log('\n▶ Step 1: Home page loads')
await page.goto(BASE, { waitUntil: 'networkidle' })
await shot('01-home')

const title = await page.title()
if (title.includes('AsadoPy')) ok(`Title contains AsadoPy: "${title}"`)
else ng(`Title wrong: "${title}"`)

const stepIndicator = page.locator('[role="progressbar"]')
if (await stepIndicator.isVisible()) ok('3-step progress indicator visible')
else ng('Step indicator not found')

const step1Label = await page.getByText('Participantes').first()
if (await step1Label.isVisible()) ok('Step 1 label "Participantes" visible')
else ng('Step 1 label not found')

// ─── 2. EMPTY STATE ──────────────────────────────────────────────────────────
log('\n▶ Step 2: Empty state')
const emptyMsg = page.getByText('Sin participantes')
if (await emptyMsg.isVisible()) ok('Empty state message shown when no participants')
else ng('No empty state for 0 participants')

const fromAgendaBtn = page.getByRole('button', { name: /Desde agenda/i })
if (await fromAgendaBtn.isVisible()) ok('"Desde agenda" button visible')
else ng('"Desde agenda" button missing')

const addManualBtn = page.getByRole('button', { name: /Agregar manual/i })
if (await addManualBtn.isVisible()) ok('"Agregar manual" button visible')
else ng('"Agregar manual" button missing')

// Next button should NOT be visible yet (no participants)
const nextBtn = page.getByRole('button', { name: /Configurar consumos/i })
if (!await nextBtn.isVisible()) ok('"Configurar consumos" hidden when no participants')
else note('"Configurar consumos" visible even with 0 participants — should be hidden')

// ─── 3. ADD MANUAL PARTICIPANT ────────────────────────────────────────────────
log('\n▶ Step 3: Add manual participant')
await addManualBtn.click()
await page.waitForSelector('[role="dialog"]')
await shot('02-manual-dialog')

const dialog = page.locator('[role="dialog"]')
if (await dialog.isVisible()) ok('Manual participant dialog opens')
else ng('Dialog did not open')

// Fill name
const nameInput = dialog.locator('input[placeholder="Ej: Pedro"]')
await nameInput.fill('Juan')

// Submit without filling → validate blank (actually name has value now)
// Click Add
const addBtn = dialog.getByRole('button', { name: /^Agregar$/i })
await addBtn.click()
await page.waitForTimeout(300)
await shot('03-after-add')

// Should see participant card
const juanCard = page.getByText('Juan').first()
if (await juanCard.isVisible()) ok('Participant "Juan" appears after adding')
else ng('Participant "Juan" not visible after adding')

// participant count
const countLabel = page.getByText(/1 participante/i)
if (await countLabel.isVisible()) ok('Participant count shows "1 participante"')
else ng('Participant count label not showing')

// Next button should now be visible
const nextVisible = await nextBtn.isVisible()
if (nextVisible) ok('"Configurar consumos" button appears after adding participant')
else ng('"Configurar consumos" still hidden after adding participant')

// ─── 4. ADD SECOND PARTICIPANT (NIÑO) ────────────────────────────────────────
log('\n▶ Step 4: Add a niño participant')
await addManualBtn.click()
await page.waitForSelector('[role="dialog"]')

const dialog2 = page.locator('[role="dialog"]')
const nameInput2 = dialog2.locator('input[placeholder="Ej: Pedro"]')
await nameInput2.fill('Tobi')

// Change sex to Niño
const sexSelect = dialog2.locator('button[role="combobox"]').first()
await sexSelect.click()
await page.getByRole('option', { name: 'Niño' }).click()
await page.waitForTimeout(200)

// Alcohol switch should be disabled for Niño
const alcoholSwitch = dialog2.locator('[role="switch"]')
const isDisabled = await alcoholSwitch.getAttribute('data-disabled') === '' ||
                   await alcoholSwitch.isDisabled()
if (isDisabled) ok('Alcohol switch is disabled for Niño')
else note('Alcohol switch not disabled for Niño (spec: prohibited)')

await dialog2.getByRole('button', { name: /^Agregar$/i }).click()
await page.waitForTimeout(300)

const tobiCard = page.getByText('Tobi').first()
if (await tobiCard.isVisible()) ok('Niño "Tobi" added successfully')
else ng('Niño "Tobi" not visible')

const count2 = page.getByText(/2 participantes/i)
if (await count2.isVisible()) ok('Count updates to "2 participantes"')
else ng('Count not updated to 2')

await shot('04-two-participants')

// ─── 5. VALIDATE EMPTY NAME ──────────────────────────────────────────────────
log('\n▶ Step 5: Validate empty name')
probe('Submit manual form with empty name')
await addManualBtn.click()
await page.waitForSelector('[role="dialog"]')
const dialog3 = page.locator('[role="dialog"]')
// Don't fill name — click Add directly
await dialog3.getByRole('button', { name: /^Agregar$/i }).click()
await page.waitForTimeout(200)
const errorMsg = dialog3.getByText(/nombre es requerido/i)
if (await errorMsg.isVisible()) ok('Validation error shown for empty name')
else note('No validation error for empty name — dialog stays open but no feedback')
// Close dialog
await dialog3.getByRole('button', { name: /Cancelar/i }).click()
await page.waitForTimeout(200)

// ─── 6. EDIT PARTICIPANT FOR EVENT ────────────────────────────────────────────
log('\n▶ Step 6: Edit participant (event-only, no contact change)')
// Click edit button on Juan
const editBtns = page.getByRole('button', { name: /Editar/i })
await editBtns.first().click()
await page.waitForSelector('[role="dialog"]')
const editDialog = page.locator('[role="dialog"]')
if (await editDialog.isVisible()) ok('Edit dialog opens for participant')
else ng('Edit dialog did not open')

// Verify the "only for this event" notice
const eventNotice = editDialog.getByText(/solo aplican a este evento/i)
if (await eventNotice.isVisible()) ok('Event-only notice shown in edit dialog')
else note('Missing notice that changes are event-only')

// Change Juan to Juana
const editNameInput = editDialog.locator('input').first()
await editNameInput.press('Control+a')
await editNameInput.fill('Juana')
await editDialog.getByRole('button', { name: /Guardar/i }).click()
await page.waitForTimeout(300)
await shot('05-after-edit')

const juanaVisible = await page.getByText('Juana').isVisible()
if (juanaVisible) ok('Participant name updated to "Juana" in event')
else ng('Participant name did not update')

// ─── 7. NAVIGATE TO STEP 2 — CONFIGURATION ────────────────────────────────────
log('\n▶ Step 7: Navigate to Configuration step')
await nextBtn.click()
await page.waitForTimeout(500)
await shot('06-step-config')

// Check step 2 content
const carneSection = page.getByText('Carne por persona', { exact: false })
if (await carneSection.isVisible()) ok('Configuration step: Carne section visible')
else ng('Configuration step: Carne section not found')

const chorizoSection = page.getByText('Chorizo por persona', { exact: false })
if (await chorizoSection.isVisible()) ok('Configuration step: Chorizo section visible')
else ng('Configuration step: Chorizo section not found')

const cervevaSection = page.getByText('Cerveza por persona', { exact: false })
if (await cervevaSection.isVisible()) ok('Configuration step: Cerveza section visible')
else ng('Configuration step: Cerveza section not found')

// Check that step indicator shows step 2 active
const step2Active = page.getByText('Configuración').first()
if (await step2Active.isVisible()) ok('Step 2 "Configuración" label visible')
else note('Step 2 label not clearly visible')

// ─── 8. BEER CONTAINER CONFIG ─────────────────────────────────────────────────
log('\n▶ Step 8: Beer container configuration')
const beerSection = page.getByText('Envase de cerveza', { exact: false })
if (await beerSection.isVisible()) ok('Beer container section visible')
else ng('Beer container section not found')

// Change capacity value
const capacityInputs = page.locator('input[type="number"]')
const count = await capacityInputs.count()
probe(`Found ${count} numeric inputs in config`)
if (count >= 6) ok(`${count} numeric inputs for consumption config (carne×3, chorizo×3, cerveza×2 + capacity)`)
else note(`Expected 6+ numeric inputs, got ${count}`)

await shot('07-config-beer')

// ─── 9. NAVIGATE TO STEP 3 — SHOPPING LIST ────────────────────────────────────
log('\n▶ Step 9: Navigate to Shopping List')
const verListaBtn = page.getByRole('button', { name: /Ver lista/i })
if (await verListaBtn.isVisible()) ok('"Ver lista" button visible')
else ng('"Ver lista" button not found')

await verListaBtn.click()
await page.waitForTimeout(500)
await shot('08-shopping-list')

// ─── 10. VERIFY SHOPPING LIST ITEMS ───────────────────────────────────────────
log('\n▶ Step 10: Shopping list items')
const shoppingHeader = page.getByText('Lista de compras', { exact: false })
if (await shoppingHeader.isVisible()) ok('Shopping list header visible')
else ng('Shopping list header not found')

const items = ['Carne', 'Chorizo', 'Mandioca', 'Pan', 'Carbón', 'Pan de ajo',
               'Sopa paraguaya', 'Hielo', 'Limón', 'Mbeju', 'Ensalada']
for (const item of items) {
  const el = page.getByText(item, { exact: false }).first()
  if (await el.isVisible()) ok(`Shopping item "${item}" visible`)
  else ng(`Shopping item "${item}" MISSING from list`)
}

// Limon should always be 6
const limonRow = page.getByText('6 unidades').first()
if (await limonRow.isVisible()) ok('Limón shows 6 unidades (always fixed)')
else ng('Limón count not visible or not 6')

// Ensalada note
const ensaladaNote = page.getByText(/difícil estimar cantidades/i)
if (await ensaladaNote.isVisible()) ok('Ensalada recommendation note visible')
else ng('Ensalada recommendation note missing')

// ─── 11. SHARE / COPY BUTTON ──────────────────────────────────────────────────
log('\n▶ Step 11: Share / copy button')
const shareBtn = page.getByRole('button', { name: /Compartir/i })
if (await shareBtn.isVisible()) ok('"Compartir" button visible in shopping list')
else ng('"Compartir" button missing')

// ─── 12. BACK NAVIGATION ──────────────────────────────────────────────────────
log('\n▶ Step 12: Back navigation from shopping list')
const configBtn = page.getByRole('button', { name: /Configurar/i }).first()
await configBtn.click()
await page.waitForTimeout(400)
const carneCheck = page.getByText('Carne por persona', { exact: false })
if (await carneCheck.isVisible()) ok('Back to config step works')
else ng('Back navigation failed — config not visible')

// Back to participants
const atrasBtn = page.getByRole('button', { name: /Atrás/i }).first()
await atrasBtn.click()
await page.waitForTimeout(400)
const participantsCheck = page.getByText('Juana').first()
if (await participantsCheck.isVisible()) ok('Back to participants step works, data preserved')
else ng('Back navigation failed — Juana not visible')

// ─── 13. REMOVE PARTICIPANT ───────────────────────────────────────────────────
log('\n▶ Step 13: Remove participant')
const deleteBtns = page.getByRole('button', { name: /Quitar/i })
const deleteCount = await deleteBtns.count()
probe(`Found ${deleteCount} delete buttons`)
await deleteBtns.first().click()
await page.waitForTimeout(400)

const count3 = page.getByText(/1 participante/i).first()
if (await count3.isVisible()) ok('Participant removed, count drops to 1')
else note('Count label not updated after removal (might show 1 differently)')

await shot('09-after-remove')

// ─── 14. CONTACTS PAGE ────────────────────────────────────────────────────────
log('\n▶ Step 14: Contacts page navigation')
const contactsLink = page.getByRole('link', { name: /Contactos/i })
await contactsLink.click()
await page.waitForURL('**/contactos**', { timeout: 5000 })
await page.waitForTimeout(500)
await shot('10-contacts-page')

if (page.url().includes('/contactos')) ok('Navigated to /contactos page')
else ng('URL not /contactos after clicking nav link')

const contactsHeading = page.getByRole('heading', { name: /Contactos/i })
if (await contactsHeading.isVisible()) ok('Contacts page heading visible')
else ng('Contacts heading not found')

const emptyContacts = page.getByText(/Sin contactos aún/i)
if (await emptyContacts.isVisible()) ok('Empty state shown for contacts')
else note('Contacts empty state not shown (there might already be contacts)')

// ─── 15. ADD CONTACT ──────────────────────────────────────────────────────────
log('\n▶ Step 15: Add a contact')
const addContactBtn = page.getByRole('button', { name: /Agregar primer contacto|Agregar contacto/i }).first()
await addContactBtn.click()
await page.waitForSelector('[role="dialog"]')
await shot('11-add-contact-dialog')

const contactDialog = page.locator('[role="dialog"]')
if (await contactDialog.isVisible()) ok('Add contact dialog opens')
else ng('Add contact dialog did not open')

// Fill contact form
await contactDialog.locator('#contact-name').fill('María García')
// Phone
const phoneInput = contactDialog.locator('#contact-phone')
await phoneInput.fill('0981 555 000')

// Submit
await contactDialog.getByRole('button', { name: /^Agregar$/i }).click()
await page.waitForTimeout(500)
await shot('12-contact-added')

const mariaCard = page.getByText('María García').first()
if (await mariaCard.isVisible()) ok('Contact "María García" appears after adding')
else ng('Contact "María García" not visible')

// ─── 16. SEARCH CONTACTS ──────────────────────────────────────────────────────
log('\n▶ Step 16: Search contacts')
const searchInput = page.getByPlaceholder(/Buscar contacto/i)
await searchInput.fill('María')
await page.waitForTimeout(300)
const searchResult = page.getByText('María García').first()
if (await searchResult.isVisible()) ok('Search finds "María García"')
else ng('Search did not find contact')

probe('Search with non-matching term')
await searchInput.fill('XXXXXXXXX')
await page.waitForTimeout(300)
const noResults = page.getByText(/No se encontraron contactos/i)
if (await noResults.isVisible()) ok('No-results message shown for empty search')
else note('No empty-search message shown')

await searchInput.fill('')
await page.waitForTimeout(200)

// ─── 17. EDIT CONTACT ─────────────────────────────────────────────────────────
log('\n▶ Step 17: Edit contact')
const editContactBtns = page.getByRole('button', { name: /Editar María García/i })
if (await editContactBtns.isVisible()) await editContactBtns.click()
else {
  // try generic edit buttons
  await page.getByRole('button', { name: /Editar/i }).first().click()
}
await page.waitForSelector('[role="dialog"]')
const editContactDialog = page.locator('[role="dialog"]')
if (await editContactDialog.isVisible()) ok('Edit contact dialog opens')
else ng('Edit contact dialog did not open')

await editContactDialog.locator('#contact-name').clear()
await editContactDialog.locator('#contact-name').fill('María García Updated')
await editContactDialog.getByRole('button', { name: /Actualizar/i }).click()
await page.waitForTimeout(500)

const updatedName = page.getByText('María García Updated').first()
if (await updatedName.isVisible()) ok('Contact name updated successfully')
else ng('Contact name update not reflected in UI')
await shot('13-contact-edited')

// ─── 18. DELETE CONTACT ───────────────────────────────────────────────────────
log('\n▶ Step 18: Delete contact')
const deleteContactBtn = page.getByRole('button', { name: /Eliminar/i }).first()
await deleteContactBtn.click()
await page.waitForSelector('[role="dialog"]')
const deleteDialog = page.locator('[role="dialog"]')
// Confirm deletion
await deleteDialog.getByRole('button', { name: /Eliminar/i }).last().click()
await page.waitForTimeout(500)
await shot('14-contact-deleted')

const deletedVisible = await page.getByText('María García Updated').isVisible()
if (!deletedVisible) ok('Contact deleted — no longer visible')
else ng('Contact still visible after deletion')

// ─── 19. SELECT FROM CONTACTS IN CALCULATOR ───────────────────────────────────
log('\n▶ Step 19: Select contact from agenda in calculator')
// First add a contact
await page.getByRole('button', { name: /Agregar primer contacto|Agregar contacto/i }).first().click()
await page.waitForSelector('[role="dialog"]')
const contactDialog2 = page.locator('[role="dialog"]')
await contactDialog2.locator('#contact-name').fill('Carlos Test')
await contactDialog2.getByRole('button', { name: /^Agregar$/i }).click()
await page.waitForTimeout(500)

// Go to calculator
const calcLink = page.getByRole('link', { name: /Calculadora/i })
await calcLink.click()
await page.waitForURL('**/', { timeout: 5000 })
await page.waitForTimeout(500)

// Remove the existing participant first by resetting via nuevo asado if step advanced
// Check if we need to go back to step 1
const fromAgendaEnabled = await page.getByRole('button', { name: /Desde agenda/i }).isEnabled()
if (fromAgendaEnabled) {
  await page.getByRole('button', { name: /Desde agenda/i }).click()
  await page.waitForSelector('[role="dialog"]')
  const agendaDialog = page.locator('[role="dialog"]')
  if (await agendaDialog.isVisible()) ok('Agenda selection dialog opens')
  else ng('Agenda dialog did not open')

  const carlosOption = agendaDialog.getByText('Carlos Test').first()
  if (await carlosOption.isVisible()) ok('Contact "Carlos Test" visible in agenda picker')
  else ng('Contact not visible in agenda picker')

  // Select it
  await carlosOption.click()
  await page.waitForTimeout(300)

  // Close dialog
  await agendaDialog.getByRole('button', { name: /Listo/i }).click()
  await page.waitForTimeout(300)

  const carlosParticipant = page.getByText('Carlos Test').first()
  if (await carlosParticipant.isVisible()) ok('Carlos Test added from contact agenda')
  else ng('Carlos Test not added from agenda')
} else {
  note('"Desde agenda" button disabled — contacts might be empty')
}

await shot('15-from-agenda')

// ─── 20. RESET CALCULATOR ─────────────────────────────────────────────────────
log('\n▶ Step 20: Nuevo asado reset flow')
// Navigate to shopping list first
const nextBtn2 = page.getByRole('button', { name: /Configurar consumos/i })
if (await nextBtn2.isVisible()) {
  await nextBtn2.click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /Ver lista/i }).click()
  await page.waitForTimeout(400)
  const nuevoAsadoBtn = page.getByRole('button', { name: /Nuevo asado/i })
  if (await nuevoAsadoBtn.isVisible()) {
    ok('"Nuevo asado" button visible in shopping list')
    await nuevoAsadoBtn.click()
    await page.waitForTimeout(400)
    const emptyAfterReset = page.getByText('Sin participantes')
    if (await emptyAfterReset.isVisible()) ok('Reset clears participants and returns to step 1')
    else ng('Reset did not clear participants')
    await shot('16-after-reset')
  } else {
    note('"Nuevo asado" button not found in list step')
  }
}

// ─── 21. DARK MODE ────────────────────────────────────────────────────────────
log('\n▶ Step 21: Dark mode toggle')
const themeToggle = page.getByRole('button', { name: /Cambiar tema/i })
if (await themeToggle.isVisible()) {
  await themeToggle.click()
  await page.waitForTimeout(300)
  const htmlEl = page.locator('html')
  const classes = await htmlEl.getAttribute('class') || ''
  if (classes.includes('dark')) ok('Dark mode class applied after toggle')
  else note('Dark mode toggle clicked but "dark" class not found on <html>')
  await shot('17-dark-mode')
  // Toggle back
  await themeToggle.click()
  await page.waitForTimeout(300)
} else {
  note('Theme toggle button not found')
}

// ─── 22. MOBILE BOTTOM NAV ────────────────────────────────────────────────────
log('\n▶ Step 22: Bottom navigation a11y')
const nav = page.locator('nav[class*="fixed"][class*="bottom"]')
if (await nav.isVisible()) ok('Bottom navigation fixed at bottom visible')
else note('Bottom nav not found with expected classes')

// ─── 23. CONSOLE ERRORS ───────────────────────────────────────────────────────
log('\n▶ Step 23: Console error check')
probe(`Collected ${consoleErrors.length} console errors during session`)
if (consoleErrors.length === 0) {
  ok('Zero console errors during entire session')
} else {
  // Filter hydration warnings that are non-critical
  const critical = consoleErrors.filter(e =>
    !e.includes('Expected server HTML') &&
    !e.includes('Hydration') &&
    !e.includes('serviceWorker')
  )
  if (critical.length === 0) {
    note(`${consoleErrors.length} non-critical console messages (hydration/SW), no critical errors`)
    consoleErrors.slice(0, 3).forEach(e => note(`  Console: ${e.slice(0, 120)}`))
  } else {
    ng(`${critical.length} critical console errors:`)
    critical.slice(0, 5).forEach(e => ng(`  ${e.slice(0, 120)}`))
  }
}

// ─── 24. PWA MANIFEST ─────────────────────────────────────────────────────────
log('\n▶ Step 24: PWA manifest reachable')
const manifestRes = await page.request.get(`${BASE}/manifest.webmanifest`)
if (manifestRes.ok()) {
  const manifest = await manifestRes.json()
  if (manifest.name?.includes('AsadoPy')) ok(`Manifest valid, name="${manifest.name}"`)
  else ng(`Manifest name unexpected: ${manifest.name}`)
  if (manifest.icons?.length >= 2) ok(`Manifest has ${manifest.icons.length} icons`)
  else note(`Manifest icons count: ${manifest.icons?.length}`)
} else {
  ng(`Manifest returned HTTP ${manifestRes.status()}`)
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
await browser.close()

console.log('\n' + '═'.repeat(60))
console.log(`RESULTS: ${pass} passed · ${fail} failed · ${warn} warnings`)
console.log('═'.repeat(60))
if (findings.length > 0) {
  console.log('\nFindings:')
  for (const f of findings) console.log(`  ${f.level === 'FAIL' ? '❌' : '⚠️ '} ${f.msg}`)
}
console.log(`\nScreenshots saved to: ${SHOTS}/`)
console.log(`\nVerdict: ${fail > 0 ? 'FAIL' : 'PASS'}`)
process.exit(fail > 0 ? 1 : 0)
