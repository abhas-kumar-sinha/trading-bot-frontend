import ArenaChart from "../components/common/line-chart/ArenaChart";

const Live = () => {
  return (
    <div>
      <div className="p-2  mt-4 bg-background border border-border rounded-xl w-fit overflow-clip">
        <ArenaChart width={800} height={450} />
      </div>
    </div>
  )
}
export default Live