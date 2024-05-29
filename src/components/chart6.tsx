/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

interface Datum {
  data?: any;
  name?: string;
  value?: number;
  type?: string;
  children?: Datum[];
}

const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 15;

const sizes = [10, 20];
const names = ["EC2", "EKS"];

function getRandomElement(array: any[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export default function Chart6() {
  const [data, setData] = useState<Datum | null>({
    name: "root",
    children: [],
  });
  const [items, setItems] = useState(0);
  const [groups, setGroups] = useState(0);
  const [singleData, setSingleData] = useState(0);
  const itemsRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HTMLInputElement>(null);
  const singleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const chartElement = document.getElementById("chart");
    if (!chartElement) return;

    // Remove any existing canvas to avoid duplicates
    d3.select(chartElement).selectAll("canvas").remove();
    const width = window.innerWidth - 6;
    const height = window.innerHeight - 6;

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d?.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(8)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(hierarchy);

    createCircularPacking(root, width, height);
  }, [data]);

  const addData = (newGroups: any[]) => {
    setData((prevData) => {
      if (!prevData?.children) {
        return { ...prevData, children: newGroups };
      }
      return { ...prevData, children: [...prevData.children, ...newGroups] };
    });
  };

  const onClickSingle = () => {
    const newGroups: any[] = Array(singleData)
      .fill(null)
      .map(() => ({
        name: "datafy-api-gateway",
        value: getRandomElement(sizes),
        type: getRandomElement(names),
      }));
    addData(newGroups);
    setSingleData(0);
    if (singleRef.current) {
      singleRef.current.value = "";
    }
  };

  const onClickGroup = () => {
    const newGroups: any[] = Array(groups)
      .fill(null)
      .map(() => ({
        name: "datafy-api-gateway",
        children: Array(items)
          .fill(null)
          .map(() => ({
            name: "datafy-api-gateway",
            value: getRandomElement(sizes),
            type: getRandomElement(names),
          })),
      }));
    addData(newGroups);
    setGroups(0);
    setItems(0);
    if (groupsRef.current) {
      groupsRef.current.value = "";
    }
    if (itemsRef.current) {
      itemsRef.current.value = "";
    }
  };

  const onReset = () => {
    setGroups(0);
    setItems(0);
    setSingleData(0);
    setData({
      name: "root",
      children: [],
    });
    if (itemsRef.current) {
      (itemsRef.current as HTMLInputElement).value = "";
    }
  };

  return (
    <>
      <div id="chart"></div>

      <div className="btns">
        <div className="group1">
          <button id="increaseBtn">+</button>
          <button id="decreaseBtn">-</button>
        </div>
      </div>

      <div className="floatform">
        <div className="form">
          <div className="form__left">
            <label htmlFor="single">Number of single data:</label>
            <input
              id="single"
              type="text"
              onChange={(e) => setSingleData(Number(e.target.value))}
              ref={singleRef}
            />
          </div>
          <button id="single" onClick={onClickSingle}>
            Add single data
          </button>
        </div>
        <div className="form">
          <div className="form__left">
            <label htmlFor="groups">Number of groups:</label>
            <input
              id="groups"
              type="text"
              onChange={(e) => setGroups(Number(e.target.value))}
              ref={groupsRef}
            />
            <label htmlFor="items">Number of items:</label>
            <input
              id="items"
              type="text"
              onChange={(e) => setItems(Number(e.target.value))}
              ref={itemsRef}
            />
          </div>
          <button onClick={onClickGroup}>Add Group</button>
        </div>
        <button onClick={onReset}>Reset</button>
      </div>
    </>
  );
}

function createCircularPacking(
  root: d3.HierarchyCircularNode<Datum>,
  width: number,
  height: number
) {
  const canvas = d3
    .select("#chart")
    .append("canvas")
    .attr("id", "canvas")
    .attr("width", width)
    .attr("height", height);

  const context = canvas.node()?.getContext("2d");

  const childrenNodes = root.descendants().filter((d) => !d.children);
  const parentNodes = root.descendants().filter((d) => d.children);

  function draw(
    transform: any,
    hoveredNode: d3.HierarchyCircularNode<Datum> | null = null
  ) {
    context?.save();
    context?.clearRect(0, 0, width, height);
    createParentNodes(transform, parentNodes, context);
    createChildrenNodes(transform, childrenNodes, context, hoveredNode);
    context?.restore();
  }

  draw(d3.zoomIdentity);

  // Find the largest parent node
  // const largestParentNode = parentNodes.reduce((max, node) => {
  //   return node.r > max.r ? node : max;
  // }, parentNodes[0]);
  // //   largest radius check
  // const largestRadius = largestParentNode?.r ? largestParentNode?.r : 1;

  // Zoom/Drag handler
  const zoom_function = d3
    .zoom()
    .scaleExtent([MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL])
    .translateExtent([
      [0, 0], // Minimum translation (top-left corner)
      [width, height], // Maximum translation (bottom-right corner)
    ])
    .on("zoom", (e) => {
      const transform = e.transform;
      context?.save();
      requestAnimationFrame(() => draw(transform));
      context?.restore();
    });

  d3.select("#increaseBtn").on("click", () => {
    canvas.transition().call(zoom_function.scaleBy as any, 1.2);
  });

  d3.select("#decreaseBtn").on("click", () => {
    canvas.transition().call(zoom_function.scaleBy as any, 0.7);
  });

  canvas.call(zoom_function as any).on("wheel.zoom", null);

  const handleMouseEvent = (event: any, checkClick = false) => {
    const [mouseX, mouseY] = d3.pointer(event);
    const transform = d3.zoomTransform(canvas.node() as any);
    let hoveredNode: d3.HierarchyCircularNode<Datum> | null = null;

    for (const node of childrenNodes) {
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

      if (distance < r) {
        hoveredNode = node;
        break;
      }
    }

    // Check for click event
    if (checkClick && hoveredNode) {
      console.log("Clicked on circle:", hoveredNode.data.data.type);
      window.alert(
        `Clicked on circle: ${hoveredNode.data.data.type}, name: ${hoveredNode.data.data.name}, value: ${hoveredNode.data.data.value}`
      );
    } else {
      // Hover event
      draw(transform, hoveredNode);
      canvas.style("cursor", hoveredNode ? "pointer" : "default");
    }
  };

  canvas.on("mousemove", (event) => handleMouseEvent(event));
  canvas.on("click", (event) => handleMouseEvent(event, true));
}

function createChildrenNodes(
  transform: d3.ZoomTransform,
  nodes: d3.HierarchyCircularNode<Datum>[],
  context: CanvasRenderingContext2D | null | undefined,
  hoveredNode: d3.HierarchyCircularNode<Datum> | null
) {
  if (context) {
    nodes.forEach((node) => {
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;

      // Set the shadow properties
      context.shadowColor =
        hoveredNode && node === hoveredNode
          ? "rgba(194, 221, 254, 0.8)"
          : "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 10; // blur radius of the shadow
      context.shadowOffsetX = 0; // horizontal offset of the shadow
      context.shadowOffsetY = 0; // vertical offset of the shadow

      // for children circles
      context.fillStyle =
        transform.k > 2.5 ? "rgba(255, 255, 255, 1)" : "rgba(66, 84, 251, 0)";
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI, true);
      context.fill();
      context.closePath();

      // Reset the shadow properties after drawing
      context.shadowColor = "rgba(0, 0, 0, 0)";
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      // for children label
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "rgb(92,99,128)";
      context.font = `${r * 0.2}px sans-serif`;
      context.fillText(node.data.data?.name ?? "", x, y + r * 0.15);

      // for children type
      context.fillStyle =
        node.data.data?.type === "EC2"
          ? "rgba(24, 146,77, 1)"
          : "rgba(239,153,70,1)";
      context.font = `${r * 0.2}px sans-serif`;
      context.fillText(node.data.data?.type ?? "", x, y + r * -0.2);

      // for children type box
      const fontSize = r * 0.2;
      context.font = `${fontSize}px sans-serif`;
      const textWidth = context.measureText(node.data.data?.type ?? "").width;
      const boxWidth = textWidth + fontSize * 0.5; // Add padding
      const boxHeight = fontSize * 1.5; // Adjust as needed
      context.fillStyle =
        node.data.data.type === "EC2"
          ? "rgba(37, 207,119, 0.3)"
          : node.data.data.type === "EKS"
          ? "rgba(255,241,189, 0.5)"
          : "none";
      context.beginPath();
      context.roundRect(
        x - boxWidth / 2,
        y + r * -0.36,
        boxWidth,
        boxHeight,
        1 + r * 0.05
      );
      context.fill();
    });
  }
}

function createParentNodes(
  transform: d3.ZoomTransform,
  nodes: d3.HierarchyCircularNode<Datum>[],
  context: CanvasRenderingContext2D | null | undefined
) {
  //   console.log("k", k);
  nodes.slice(1).forEach((node) => {
    const x = transform.applyX(node.x);
    const y = transform.applyY(node.y);
    const r = transform.k * node.r;
    if (context) {
      context.fillStyle = "rgba(66, 84, 251, 0.05)";
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI, true);
      context.fill();
      context.closePath();
    }
  });
}
