"use client";

import ReferenceUploadSlot from "@/app/components/reference-upload-slot";
import {
  createBrandProduct,
  deleteBrandProduct,
  fetchBrandProducts,
  updateBrandProduct,
} from "@/utils/brands-client";
import { uploadReferenceImage } from "@/utils/upload-reference";
import type { BrandProduct } from "@/types/brand";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface BrandProductsSectionProps {
  brandId: string;
  user: User;
}

interface ProductEditorProps {
  brandId: string;
  user: User;
  product: BrandProduct;
  saving: boolean;
  onCancel: () => void;
  onSaved: (product: BrandProduct) => void;
}

function ProductEditor({
  brandId,
  user,
  product,
  saving,
  onCancel,
  onSaved,
}: ProductEditorProps) {
  const supabase = createClient();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(
    product.product_reference_url,
  );
  const [clearedPhoto, setClearedPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileSelect(file: File | null) {
    setProductFile(file);

    setProductPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return file ? URL.createObjectURL(file) : null;
    });

    setClearedPhoto(file === null);
  }

  async function handleSave() {
    setError(null);
    setSubmitting(true);

    try {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("Product name is required");
      }

      let productReferenceUrl: string | null | undefined;

      if (productFile) {
        productReferenceUrl = await uploadReferenceImage(
          supabase,
          productFile,
          user.id,
          "product",
        );
      } else if (clearedPhoto) {
        productReferenceUrl = null;
      }

      const updated = await updateBrandProduct(brandId, product.id, {
        name: trimmedName,
        description: description.trim() ? description.trim() : null,
        ...(productReferenceUrl !== undefined
          ? { product_reference_url: productReferenceUrl }
          : {}),
      });

      onSaved(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save product",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/40 p-4">
      <label
        htmlFor={`product-name-${product.id}`}
        className="block text-sm font-medium text-secondary-foreground"
      >
        Product name
      </label>
      <input
        id={`product-name-${product.id}`}
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={submitting || saving}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <label
        htmlFor={`product-description-${product.id}`}
        className="block text-sm font-medium text-secondary-foreground"
      >
        Description (optional)
      </label>
      <textarea
        id={`product-description-${product.id}`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        disabled={submitting || saving}
        placeholder="Short note about this product for your own reference"
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <ReferenceUploadSlot
        id={`product-photo-${product.id}`}
        label="Product photo"
        description="Optional reference for this product."
        hint="Plain background works best."
        slotType="product"
        previewUrl={productPreview}
        disabled={submitting || saving}
        onFileSelect={handleFileSelect}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || saving || name.trim().length === 0}
          onClick={() => void handleSave()}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save product"}
        </button>
        <button
          type="button"
          disabled={submitting || saving}
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-ring/60 hover:text-foreground disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function BrandProductsSection({
  brandId,
  user,
}: BrandProductsSectionProps) {
  const supabase = createClient();
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchBrandProducts(brandId);

        if (!cancelled) {
          setProducts(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load products",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let productReferenceUrl: string | null = null;

      if (productFile) {
        productReferenceUrl = await uploadReferenceImage(
          supabase,
          productFile,
          user.id,
          "product",
        );
      }

      const created = await createBrandProduct(brandId, {
        name: name.trim(),
        product_reference_url: productReferenceUrl,
        description: description.trim() ? description.trim() : null,
      });

      setProducts((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setDescription("");
      setProductFile(null);
      setProductPreview(null);
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Failed to add product",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: string) {
    setError(null);
    setDeletingId(productId);

    try {
      await deleteBrandProduct(brandId, productId);
      setProducts((current) =>
        current.filter((product) => product.id !== productId),
      );

      if (editingProductId === productId) {
        setEditingProductId(null);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete product",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleFileSelect(file: File | null) {
    setProductFile(file);

    setProductPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleProductSaved(updated: BrandProduct) {
    setProducts((current) =>
      current
        .map((product) => (product.id === updated.id ? updated : product))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditingProductId(null);
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">Products</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Optional named products with their own reference photo. Pick one when
        creating a campaign to override the brand&apos;s default product image.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading products…</p>
      ) : null}

      {products.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              {editingProductId === product.id ? (
                <ProductEditor
                  brandId={brandId}
                  user={user}
                  product={product}
                  saving={saving}
                  onCancel={() => setEditingProductId(null)}
                  onSaved={handleProductSaved}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.product_reference_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.product_reference_url}
                        alt=""
                        className="h-12 w-12 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                      {product.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deletingId === product.id}
                      onClick={() => setEditingProductId(product.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/60 disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === product.id}
                      onClick={() => void handleDelete(product.id)}
                      className="text-xs font-medium text-red-400 transition hover:underline disabled:opacity-60"
                    >
                      {deletingId === product.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={(event) => void handleAdd(event)} className="mt-6 space-y-4">
        <label
          htmlFor="product-name"
          className="block text-sm font-medium text-secondary-foreground"
        >
          Add product
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Vitamin C serum"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <label
          htmlFor="new-product-description"
          className="block text-sm font-medium text-secondary-foreground"
        >
          Description (optional)
        </label>
        <textarea
          id="new-product-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Short note about this product for your own reference"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <ReferenceUploadSlot
          id="brand-product-photo"
          label="Product photo"
          description="Optional reference for this product."
          hint="Plain background works best."
          slotType="product"
          previewUrl={productPreview}
          disabled={saving}
          onFileSelect={handleFileSelect}
        />
        <button
          type="submit"
          disabled={saving || name.trim().length === 0}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
