"""Approximate USD-per-million-token pricing for cost estimation.

Prices are indicative list prices for hosted models, used to give a rough
sense of per-query spend. Local Ollama models run on the host's own
hardware and are always priced at $0.
"""

# (provider, model) -> (input price per 1M tokens, output price per 1M tokens), USD
_PRICING: dict[tuple[str, str], tuple[float, float]] = {
    ("anthropic", "claude-sonnet-4-5"): (3.00, 15.00),
    ("anthropic", "claude-opus-4-5"): (15.00, 75.00),
    ("anthropic", "claude-haiku-4-5"): (1.00, 5.00),
    ("openai", "gpt-4o"): (2.50, 10.00),
    ("openai", "gpt-4o-mini"): (0.15, 0.60),
    ("openai", "gpt-4.1"): (2.00, 8.00),
    ("openai", "gpt-4.1-mini"): (0.40, 1.60),
}


def estimate_cost_usd(
    provider: str, model: str, input_tokens: int, output_tokens: int
) -> float | None:
    """Return an estimated USD cost for a request, or None if unknown.

    Local providers (e.g. Ollama) are free. Hosted providers fall back to
    None when the model isn't in the pricing table, so the UI can still show
    token counts without an inaccurate cost figure.
    """
    if provider == "ollama":
        return 0.0

    pricing = _PRICING.get((provider, model))
    if pricing is None:
        return None

    input_price, output_price = pricing
    return (input_tokens * input_price + output_tokens * output_price) / 1_000_000
