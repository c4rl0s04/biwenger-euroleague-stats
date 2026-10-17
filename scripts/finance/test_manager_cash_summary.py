import unittest

from scripts.finance.manager_cash_summary import render


class ManagerCashSummaryTest(unittest.TestCase):
    def setUp(self):
        self.report = {
            'options': {'seasonId': '2026-27', 'startDate': '2026-09-19', 'budget': 40_000_000,
                        'showAllDetails': True, 'managerFilter': None},
            'ledgers': [{
                'userId': '1', 'name': 'Alex | <script>', 'initialSquadValue': 10_000_000,
                'initialCash': 30_000_000, 'totalSales': 2_000_000,
                'totalPurchases': 1_000_000, 'totalBonuses': 500_000,
                'currentCash': 31_500_000, 'currentSquadValue': 12_000_000,
                'totalTeamValue': 43_500_000, 'netProfit': 3_500_000,
                'initialSquad': [{'name': 'Player A', 'price': 10_000_000, 'priceDate': '2026-09-19'}],
                'sales': [{'date': '2026-10-01', 'playerName': 'Player B', 'counterparty': 'Market', 'price': 2_000_000}],
                'purchases': [{'date': '2026-10-02', 'playerName': 'Player C', 'counterparty': 'Market', 'price': 1_000_000}],
                'bonuses': [{'date': '2026-10-03', 'description': 'Round bonus', 'amount': 500_000}],
                'currentSquad': [{'name': 'Player C', 'currentPrice': 12_000_000, 'source': 'market'}],
            }],
        }

    def test_render_full_report(self):
        output = render(self.report)
        self.assertIn('**31.500.000 €**', output)
        self.assertIn('<summary>Alex | &lt;script&gt; · cash 31.500.000 €</summary>', output)
        self.assertIn('Player B · Market · **+2.000.000 €**', output)
        self.assertIn('Round bonus · **+500.000 €**', output)
        self.assertNotIn('<script>', output)

    def test_summary_only(self):
        self.report['options']['showAllDetails'] = False
        output = render(self.report)
        self.assertIn('### 1. Alex \\| &lt;script&gt;', output)
        self.assertNotIn('<details>', output)

    def test_loan_fee_is_shown_as_a_negative_cash_adjustment(self):
        manager = self.report['ledgers'][0]
        manager['bonuses'].append({'date': '2026-10-07', 'description': 'Loan fee', 'amount': -600_000})
        manager['totalBonuses'] = -100_000
        manager['currentCash'] = 30_900_000

        output = render(self.report)
        self.assertIn('Cash adjustments | −100.000 €', output)
        self.assertIn('Loan fee · **−600.000 €**', output)
        self.assertNotIn('+-', output)


if __name__ == '__main__':
    unittest.main()
