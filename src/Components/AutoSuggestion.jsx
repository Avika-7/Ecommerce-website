import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, ArrowUpRight, X, Star } from "lucide-react";

async function fetchProducts(query) {
  const res = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

async function fetchPopular() {
  const res = await fetch(`https://dummyjson.com/products?limit=8&sortBy=rating&order=desc`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#E2D5BC] bg-[#FFFDF8]">
      <div className="h-48 animate-pulse bg-[#E2D5BC]/40" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#E2D5BC]/60" />
        <div className="h-3 w-full animate-pulse rounded bg-[#E2D5BC]/40" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#E2D5BC]/40" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-[#E2D5BC]/60" />
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const hasDiscount = product.discountPercentage > 0;
  const original = hasDiscount
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
    : null;

  return (
    <article
      className="
        group relative flex flex-col overflow-hidden rounded-lg
        border border-[#E2D5BC] bg-[#FFFDF8]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(30,59,50,0.14)]
      "
    >
      {/* perforated "ticket" edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #E2D5BC 0 6px, transparent 6px 12px)",
        }}
      />
      <span className="absolute left-4 top-4 z-10 h-2.5 w-2.5 rounded-full border border-[#E2D5BC] bg-[#F4EEE0]" />

      {hasDiscount && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-[#B1502F] px-2.5 py-1 font-mono text-[11px] font-semibold text-white shadow-sm">
          -{Math.round(product.discountPercentage)}%
        </span>
      )}

      <div className="flex h-48 items-center justify-center bg-[#F4EEE0] p-8">
        {!imgError ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#71675A]">
            No image available
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71675A]">
          {product.category}
        </p>

        <h4 className="mt-1.5 line-clamp-1 font-serif text-[18px] font-semibold text-[#241F1A]">
          {product.title}
        </h4>

        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-[#71675A]">
          {product.description}
        </p>

        {typeof product.rating === "number" && (
          <div className="mt-2 flex items-center gap-1 text-[#D6A83B]">
            <Star size={13} fill="currentColor" strokeWidth={0} />
            <span className="text-xs font-medium text-[#71675A]">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-[#1E3B32]">
              ${product.price}
            </span>
            {hasDiscount && (
              <span className="font-mono text-xs text-[#71675A] line-through">
                ${original}
              </span>
            )}
          </div>

          <button
            className="
              flex items-center gap-1 rounded-full bg-[#1E3B32] px-3.5 py-2
              text-sm font-medium text-white transition
              hover:bg-[#152A22]
              focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#D6A83B]
            "
          >
            View
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

const AutoSuggestion = () => {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [mode, setMode] = useState("popular"); // "popular" | "search"

  const timerIdRef = useRef();
  const inputRef = useRef();

  // Load popular products on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPopular()
      .then((data) => {
        if (!cancelled) setResults(data.products || []);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "search") return;

    let cancelled = false;

    async function run() {
      if (query.trim().length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrored(false);

      try {
        const data = await fetchProducts(query);
        if (!cancelled) setResults(data.products || []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch products:", error);
          setResults([]);
          setErrored(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query, mode]);

  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    setInputValue(value);
    setMode(value.trim() ? "search" : "popular");

    clearTimeout(timerIdRef.current);
    timerIdRef.current = setTimeout(() => {
      setQuery(value);
    }, 500);
  }, []);

  const clearSearch = useCallback(() => {
    clearTimeout(timerIdRef.current);
    setInputValue("");
    setQuery("");
    setMode("popular");
    inputRef.current?.focus();
  }, []);

  const heading =
    mode === "search" && query.trim()
      ? `Results for "${query.trim()}"`
      : "Today's picks";

  return (
    <main
      className="min-h-screen bg-[#F4EEE0] px-6 py-10 text-[#241F1A]"
      style={{
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Header band */}
        <header className="overflow-hidden rounded-2xl bg-[#1E3B32] px-8 py-9 text-[#F4EEE0] sm:px-10">
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl font-semibold tracking-tight">
              Shop<span className="text-[#D6A83B]">Ease</span>
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4EEE0]/70 sm:block">
              · Everyday Goods
            </span>
          </div>

          <h1 className="mt-8 max-w-xl font-serif text-4xl font-medium leading-[1.1] sm:text-5xl">
            Find something
            <br />
            worth <span className="text-[#D6A83B]">bringing home.</span>
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-6 text-[#F4EEE0]/75">
            Search the full catalog, or browse what's earning top marks this
            week.
          </p>
        </header>

        {/* Search ledger — floats up over the header */}
        <div className="relative z-10 mx-auto -mt-6 max-w-2xl px-2">
          <div className="group relative">
            <Search
              size={19}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#71675A] transition group-focus-within:text-[#1E3B32]"
            />

            <input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              type="text"
              aria-label="Search products"
              placeholder="Search products..."
              className="
                w-full rounded-xl border border-[#E2D5BC] bg-[#FFFDF8]
                py-4 pl-13 pr-12 text-[15px] text-[#241F1A] shadow-[0_10px_28px_rgba(30,25,15,0.1)]
                outline-none transition duration-200
                placeholder:text-[#71675A]/70
                hover:border-[#1E3B32]/30
                focus:border-[#1E3B32]
                focus:ring-4 focus:ring-[#1E3B32]/10
              "
            />

            {inputValue && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="
                  absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1
                  text-[#71675A] transition hover:bg-[#E2D5BC]/60 hover:text-[#241F1A]
                  focus-visible:outline focus-visible:outline-[#1E3B32]
                "
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results heading */}
        <div className="mb-5 mt-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#D6A83B]">
              {mode === "search" ? "Search" : "Collection"}
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-[#241F1A]">
              {heading}
            </h3>
          </div>

          {!loading && results.length > 0 && (
            <span className="font-mono text-xs text-[#71675A]">
              {results.length} item{results.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : errored ? (
          <div className="rounded-2xl border border-[#E2D5BC] bg-[#FFFDF8] py-16 text-center">
            <p className="text-lg font-medium text-[#241F1A]">
              Something went wrong.
            </p>
            <p className="mt-2 text-sm text-[#71675A]">
              Check your connection and try searching again.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E2D5BC] bg-[#FFFDF8] py-16 text-center">
            <p className="text-lg font-medium text-[#241F1A]">Nothing found.</p>
            <p className="mt-2 text-sm text-[#71675A]">
              Try a different search term.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default AutoSuggestion;
