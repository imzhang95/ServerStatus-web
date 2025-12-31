import "./App.css";

import intl from "react-intl-universal";
import React, { useState, useEffect, useCallback } from "react";
import { Layout, Row, Col, Spin } from "antd";

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

import ServerRow from "./ServerRow";

const { Header, Footer, Content } = Layout;

const LOCALE_DATA = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

const App: React.FC<any> = () => {
  const [serverData, setServerData] = useState({ servers: [], updated: "0" });
  const [isOnline, setIsOnline] = useState(false);
  const [initDone, setInitDone] = useState(false);

  // 【修改 1】状态增加一种，且默认值设为 'no-container' (仅非容器)
  const [filterType, setFilterType] = useState<'all' | 'container' | 'no-container'>('no-container');
  
  const setCurrentLocale = (currentLocale: string) => {
    intl.init({
      // debug: true,
      currentLocale,
      locales: LOCALE_DATA,
    });
  };

  const initializeIntl = useCallback(() => {
    if (initDone) {
      return
    }
    // 1. Get the currentLocale from url, cookie, or browser setting
    let currentLocale = intl.determineLocale({
      fallbackLocale: 'en-US',
    });

    // 2. Fallback to "en-US" if the currentLocale isn't supported in LOCALES_LIST
    if (currentLocale.startsWith("zh-")) {
      currentLocale = "zh-CN";
    } else {
      currentLocale = "en-US";
    }

    // 3. Set currentLocale and load locale data 
    setCurrentLocale(currentLocale);

    // 4. After loading locale data, start to render
    setInitDone(true);
  }, [initDone])
  

  useEffect(() => {
    initializeIntl()
    const fetchData = () => {
      fetch("json/stats.json")
        .then((res) => res.json())
        .then((data) => {
          setServerData(data);
          setIsOnline(true);
        })
        .catch((e) => console.log("错误:", e));
    };
    fetchData();
    let itv = setInterval(fetchData, 3000);
    return () => {
      clearInterval(itv);
    };
  }, [initializeIntl]);

  // 【修改 2】更新筛选逻辑：定义 nat 和 nat/6 为容器
  const filteredServers = serverData.servers.filter((s: any) => {
    // 1. 获取类型并转小写
    const type = (s.type || '').toLowerCase();
    
    // 2. 定义什么是“容器” (根据你的需求：nat 和 nat/6)
    const isContainer = type === 'nat' || type === 'nat/6';

    // 3. 根据当前 filterType 决定是否保留
    if (filterType === 'all') return true;             // 显示全部
    if (filterType === 'container') return isContainer; // 仅显示容器
    if (filterType === 'no-container') return !isContainer; // 仅显示非容器 (默认)
    
    return true;
  });

  // 传递过滤后的数据
  const displayData = { ...serverData, servers: filteredServers };
  
  return (
    <div className="App">
      {initDone && (<Layout>
        <Header>
          <div className="logo">Status</div>
        </Header>
        <Content style={{ background: "#fff" }}>
          <Row justify="center">
            <Col xs={24} sm={23} md={23} lg={22} xl={20} xxl={16}>
              {initDone ? (
                <Spin size="large" spinning={!isOnline} tip="Loading...">
                  <ServerRow {...displayData} />
                </Spin>
              ) : (
                  <div />
                )}
            </Col>
          </Row>
        </Content>
        <Footer className="footer">
          <a target="_blank" rel="noopener noreferrer" href="/detail">🗂️</a>
          {" | ServerStatus-Rust | "}
          <a target="_blank" rel="noopener noreferrer" href="/map">🗺️</a>

          {/* 【修改 3】底部筛选区域：三个按钮 */}
          <div style={{ marginTop: '10px', userSelect: 'none' }}>
            {/* 按钮 1: 仅非容器 */}
            <span 
              onClick={() => setFilterType('no-container')} 
              style={{ 
                cursor: 'pointer', 
                fontWeight: filterType === 'no-container' ? 'bold' : 'normal',
                color: filterType === 'no-container' ? '#1890ff' : 'inherit'
              }}
            >
              [ 仅非容器 ]
            </span>

            <span style={{ margin: '0 8px' }}>|</span>

            {/* 按钮 2: 仅容器 */}
            <span 
              onClick={() => setFilterType('container')} 
              style={{ 
                cursor: 'pointer', 
                fontWeight: filterType === 'container' ? 'bold' : 'normal',
                color: filterType === 'container' ? '#1890ff' : 'inherit'
              }}
            >
              [ 仅容器 ]
            </span>

            <span style={{ margin: '0 8px' }}>|</span>

            {/* 按钮 3: 显示全部 */}
            <span 
              onClick={() => setFilterType('all')} 
              style={{ 
                cursor: 'pointer', 
                fontWeight: filterType === 'all' ? 'bold' : 'normal',
                color: filterType === 'all' ? '#1890ff' : 'inherit'
              }}
            >
              [ 全部 ]
            </span>
          </div>
        </Footer>
      </Layout>
      )}
    </div>
  );
};

export default App;
