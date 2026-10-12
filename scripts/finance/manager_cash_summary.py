"""Render the existing ledger data for a GitHub Actions run page."""

import html
import json
import re
import sys
from pathlib import Path


def safe(value):
    value = html.escape(str(value).replace('\n', ' ').replace('\r', ' '))
    return re.sub(r'([\\`*_{}\[\]()#+.!|>~-])', r'\\\1', value)


def euros(value):
    return f"{value:,.0f}".replace(',', '.') + ' €'


def transactions(title, items, description, sign=''):
    lines = [f'#### {title}', '']
    if not items:
        return lines + ['None recorded.', '']
    for item in items:
        detail = safe(item[description] or item.get('type', ''))
        counterparty = item.get('counterparty')
        counterpart = f" · {safe(counterparty)}" if counterparty else ''
        lines.append(f"- {safe(str(item['date'])[:10])} · {detail}{counterpart} · **{sign}{euros(item['price'] if 'price' in item else item['amount'])}**")
    return lines + ['']


def render(data):
    options = data['options']
    ledgers = data['ledgers']
    lines = [
        '# Manager cash report',
        '',
        f"Season **{safe(options['seasonId'])}** · initial squad date **{safe(options['startDate'])}** · starting budget **{euros(options['budget'])}**",
        '',
        'Calculated from the latest synced data. Share this workflow run link to share the report.',
        '',
    ]
    for rank, manager in enumerate(ledgers, 1):
        lines += [
            f"### {rank}. {safe(manager['name'])}",
            '',
            f"**Cash: {euros(manager['currentCash'])}** · Squad: {euros(manager['currentSquadValue'])} · Net worth: {euros(manager['totalTeamValue'])} · Profit/loss: {euros(manager['netProfit'])}",
            '',
        ]
    if not ledgers:
        lines += ['', 'No active managers found.']
    overview = lines.copy()

    if options.get('showAllDetails') or options.get('managerFilter'):
        selected = ledgers
        if options.get('managerFilter'):
            needle = options['managerFilter'].lower()
            selected = [m for m in ledgers if needle in m['name'].lower() or m['userId'] == options['managerFilter']][:1]
        lines += ['', '## Manager details', '']
        for manager in selected:
            summary_name = html.escape(manager['name'].replace('\n', ' ').replace('\r', ' '))
            lines += [
                '<details>',
                f"<summary>{summary_name} · cash {euros(manager['currentCash'])}</summary>",
                '',
                '| Cash calculation | Amount |',
                '| --- | ---: |',
                f"| Starting budget | {euros(options['budget'])} |",
                f"| Initial squad | −{euros(manager['initialSquadValue'])} |",
                f"| Initial cash | {euros(manager['initialCash'])} |",
                f"| Sales | +{euros(manager['totalSales'])} |",
                f"| Purchases | −{euros(manager['totalPurchases'])} |",
                f"| Bonuses | +{euros(manager['totalBonuses'])} |",
                f"| **Current cash** | **{euros(manager['currentCash'])}** |",
                '',
                '#### Initial squad',
                '',
                *[f"- {safe(player['name'])} · {euros(player['price'])} (price date {safe(player['priceDate'])})" for player in manager['initialSquad']],
                '',
            ]
            lines += transactions('Sales', manager['sales'], 'playerName', '+')
            lines += transactions('Purchases', manager['purchases'], 'playerName', '−')
            lines += transactions('Bonuses', manager['bonuses'], 'description', '+')
            lines += [
                '#### Current squad',
                '',
                *[f"- {safe(player['name'])} · {euros(player['currentPrice'])} ({safe(player['source'])})" for player in manager['currentSquad']],
                '',
                f"**Squad value:** {euros(manager['currentSquadValue'])} · **Net worth:** {euros(manager['totalTeamValue'])} · **Profit/loss:** {euros(manager['netProfit'])}",
                '',
                '</details>',
                '',
            ]

    output = '\n'.join(lines) + '\n'
    if len(output.encode()) > 900_000:
        # shortcut: huge reports show the ranking only; use the artifact for the full audit.
        output = '\n'.join(overview + ['', 'Details exceed the run summary limit. Download the full text artifact.']) + '\n'
    return output


if __name__ == '__main__':
    Path(sys.argv[2]).write_text(render(json.loads(Path(sys.argv[1]).read_text())))
