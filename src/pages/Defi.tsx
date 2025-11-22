import CoinDetails from "../components/defi/layout/coin-details";
import CoinChart from "../components/defi/charts/coin-charts";
import PortfolioCard from "../components/defi/portfolio/portfolio-card";
import Transactions from "../components/defi/transactions/transactions";
import SocialTracker from "../components/defi/transactions/socialTracker";
// import PortfolioTransactions from "../components/dashboard/transactions/portfolioTransactions";

const Defi = () => {
  return (
    <>
      <CoinDetails />
      <div className="flex mt-3 gap-x-3 h-103">
        <CoinChart />
        <PortfolioCard />
      </div>
      <div className="flex mt-3 gap-x-3 h-110 w-full">
        <SocialTracker />
        <Transactions />
      </div>
      {/* <div className="flex mt-3 gap-x-3 h-120 w-full">
        <PortfolioTransactions />
      </div> */}
    </>
  )
}
export default Defi