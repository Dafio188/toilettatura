import test from "node:test";
import assert from "node:assert/strict";

const mod = await import(new URL("./dog-photo-upload.ts", import.meta.url).href);
const {
  DOG_PHOTO_MAX_BYTES,
  validateDogPhotoFile,
  describeDogPhotoError
} = mod;

const owner = "11111111-1111-4111-8111-111111111111";

function fakeFile(props: Partial<File>): File {
  const size = props.size ?? 1024;
  const bytes = new Uint8Array(size);
  return new File([bytes], props.name ?? "dog.png", {
    type: props.type ?? "image/png",
    lastModified: props.lastModified ?? 0
  });
}

test("validateDogPhotoFile - no user -> NO_USER", () => {
  const f = fakeFile({});
  const res = validateDogPhotoFile(f, null);
  assert.equal(res.kind, "NO_USER");
  assert.equal(describeDogPhotoError(res), "Devi effettuare l'accesso per caricare una foto.");
});

test("validateDogPhotoFile - file vuoto -> EMPTY", () => {
  const f = fakeFile({ size: 0 });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "EMPTY");
});

test("validateDogPhotoFile - troppo grande -> TOO_LARGE", () => {
  const f = fakeFile({ size: DOG_PHOTO_MAX_BYTES + 1 });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "TOO_LARGE");
  if (res.kind === "TOO_LARGE") {
    assert.ok(describeDogPhotoError(res).includes("File troppo grande"));
  }
});

test("validateDogPhotoFile - mime errato -> BAD_MIME", () => {
  const f = fakeFile({ type: "application/pdf" });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "BAD_MIME");
});

test("validateDogPhotoFile - ok png -> restituisce path nella cartella owner e kind OK", () => {
  const f = fakeFile({ type: "image/png", size: 42000 });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "OK");
  const v = res;
  assert.equal(v.mime, "image/png");
  assert.equal(v.extension, "png");
  assert.equal(v.bytes, 42000);
  assert.ok(v.objectKey.startsWith(`${owner}/`), "objectKey deve iniziare per owner_id/");
  assert.ok(v.objectKey.endsWith(".png"));
});

test("validateDogPhotoFile - ok jpeg -> extension jpg", () => {
  const f = fakeFile({ type: "image/jpeg", name: "ciccio.jpg" });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "OK");
  assert.equal(res.extension, "jpg");
  assert.ok(res.objectKey.endsWith(".jpg"));
});

test("validateDogPhotoFile - ok webp", () => {
  const f = fakeFile({ type: "image/webp" });
  const res = validateDogPhotoFile(f, owner);
  assert.equal(res.kind, "OK");
  assert.equal(res.extension, "webp");
});
