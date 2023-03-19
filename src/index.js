 // 画布基本参数
 const width = 1200
 const height = 600
 const margin = {top: 20, right:10, left: 10, bottom: 10}
 let max = null;
// X轴线型映射
 let x = null;
// y轴条带映射
 let y = null;
// 图表最大可以显示的数据条目数量，即选出 top 12
 let n = 12;


 fetchData();

// 读取 csv 数据
async function fetchData() {
  // autoType 能够把日期转换为了JavaScript的Date对象
  const data = await d3.csv('../category-brands.csv', d3.autoType)
  max = d3.max(data, row => row.value)

  // 以年为单位，拆分数据
  const dateMap = new Map()
  for(let row of data ) {
    let year = row.date.getFullYear()
    if(!dateMap.has(year)) {
      dateMap.set(year, [row])
    } else {
      dateMap.get(year).push(row)
    }
  }

  document.querySelector('#replay').addEventListener('click',() => {
    console.log('replay');
    d3.select('svg').remove()   // 清除上一个svg
    // draw(svg,bars,axis,labels,dateMap)
    renderBarChart(dateMap)
  })

  renderBarChart(dateMap)
}

// 渲染svg,容器
async function renderBarChart(dateMap) {

  // 防止当数据值很大的时候，画出的条形bar可能就会超出整个设定的画布宽度
  x = d3.scaleLinear().domain([0,max]).range([margin.left, width-margin.right])

  // d3.scaleBand是专用于柱状图这类以宽度填充整个空间范围的映射。
  y = d3.scaleBand()
  .domain(d3.range(n + 1))
  .range([margin.top, height])
  .padding(0.2)     // band 间距

  // bandwidth() 获取每个band的宽度
  console.log("bandwidth",y.bandwidth());

  // 创建SVG，此时svg标签是空的 (如果使用append 是添加)
  const svg = d3.select('#box')
    .append('svg')
    .attr('width', width)   
    .attr('height',height)
    // .attr("viewBox", [0, 0, width, height]);  // svg viewbox属性参数列表 min-x, min-y, width and height

  // 创建容器，svg <g> 相当于一个容器，可以把svg的元素分类存放，互不影响
  const bars = svg.append('g')    // 条形bar容器
  // 坐标轴，容器上属性配合transform调整位置
  const axis = svg.append('g').attr('transform',`translate(0,${margin.top})`)   
  //bar标签容器， text-anchor属性设置文本与所给点的对齐方式 
  const labels = svg.append('g').style("font", "bold 12px sans-serif").attr("text-anchor", "end")   
  const ticker = svg.append('text').style("font", `bold ${y.bandwidth()}px sans-serif`)
  
  // draw(svg,bars,axis,labels,ticker,dateMap)
  for(let [date,keyframe] of dateMap) {
    // 生成一段动画配置，持续250ms
    const transition = svg.transition()   
      .duration(250)
      .ease(d3.easeLinear);

      x.domain([0, d3.max(keyframe, row => row.value)]);  // 重新进行映射

      keyframe.sort((a,b) => d3.descending(a.value, b.value))   // 排序
      drawBars(bars,keyframe,transition)
      drawAxis(axis,keyframe,transition)
      drawLabels(labels,keyframe,transition)
      drawTicker(ticker,date,transition)
      
      await transition.end().catch(error => {});  // 等待上一个过渡结束
  }
}



// 绘制条形bar
function drawBars(bars,data,t) {
  bars.selectAll('rect').data(data.slice(0,n))
    .join(
      enter => enter.append('rect')
        .attr('fill', d => color(d.category))
        .attr('x', x(0))    // 固定最左侧
        .attr('y', (d,i) => y(i) )
        .attr('width',(d) => x(d.value))      // 函数类似于forEach/map 的回调参数(item,index)
        .attr('height',y.bandwidth()),
      update => update.transition(t)
        .attr("y", (d, i) => y(i))
        .attr("width", d => x(d.value)),
      exit => exit.transition(t)
        .attr("y", height)
        .attr("width", 0)
        .remove(), // 在transition之后的remove会在动画结束后自动执行
    )

}

// 绘制坐标轴
function drawAxis(axis, data,t) {
  // D3方法axisTop绘制
  xAxis = d3.axisTop(x)     
    .ticks(width/160)
  axis.call(xAxis);
}

// 绘制标签
function drawLabels(labels,data,t) {
  labels.selectAll('text').data(data.slice(0,n))
    .join(
      enter => enter.append('text')
        .attr('fill', 'black')
        .attr('x', (d) => x(d.value))    // 固定最左侧
        .attr('y', (d,i) => y(i) + y.bandwidth()/2+5 )
        // .attr("transform", (d, i) => `translate(${x(d.value)},${y(i)})`)
        .text(d => d.name),    // innerHTML
      update => update.transition(t)
        .attr('x', (d) => x(d.value)) 
        .attr("width", d => x(d.value))
        .text(d => d.name),
      exit => exit.transition(t)
        .attr("y", height)
        .attr("width", 0)
        .remove(), 
    )
    
}

// 绘制年份
function drawTicker(ticker,date,t) {
  ticker.attr("text-anchor", "end")
    .attr("x", width-y.bandwidth()*2)
    .attr("y", height-y.bandwidth()*2)
    .text(date)
}


// 颜色映射，使用预设色板。
const color = d3.scaleOrdinal(d3.schemeTableau10)

