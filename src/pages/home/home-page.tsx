import { useEffect, useState } from "react";
import { Breadcrumb, Form, Input, Button, InputNumber, Table } from "antd";
import { ADDRESS_ZERO, useContract } from "../../blockchain";
import { TransferApi } from "../../api";
import { Transfer as ITransfer } from "../../types/schemas";
import { Transfer } from "../../database";
import { ethers } from "ethers";

export const HomePage = () => {
  const [state, setState] = useState<{
    contractAddress: string;
    firstBlockNumber: number;
  }>({
    contractAddress: ADDRESS_ZERO,
    firstBlockNumber: 0,
  });
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const contract = useContract(state.contractAddress);

  const onFinish = (values: any) => {
    setState({
      ...values,
      contractAddress: values.contractAddress.toLowerCase(),
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    if (contract) {
      contract
        .totalSupply()
        .then(async () => {
          const totalBlock = await contract.provider.getBlockNumber();
          console.log(contract.address, state.firstBlockNumber, totalBlock);
          await TransferApi.fetchHistory(
            contract,
            state.firstBlockNumber,
            totalBlock
          );
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [contract, state.firstBlockNumber]);

  useEffect(() => {
    const transferStore = new Transfer(state.contractAddress);
    transferStore.tx(async (tx) => {
      const blockNumberIndex = tx.store.index("by-block-number");
      // const result = await blockNumberIndex.get(
      //   window.IDBKeyRange.bound(
      //     [state.contractAddress, state.firstBlockNumber],
      //     [state.contractAddress, Infinity]
      //   )
      // );
      const result = await blockNumberIndex.getAll(
        window.IDBKeyRange.bound(
          [state.contractAddress, state.firstBlockNumber],
          [state.contractAddress, Infinity]
        )
      );

      if (result) {
        setTransfers(result);
      }
    });
  }, [state]);

  return (
    <>
      <Breadcrumb style={{ margin: "16px 0" }}>
        <Breadcrumb.Item>Home</Breadcrumb.Item>
        <Breadcrumb.Item>List</Breadcrumb.Item>
        <Breadcrumb.Item>App</Breadcrumb.Item>
      </Breadcrumb>
      <div
        className="site-layout-background"
        style={{ padding: 24, minHeight: 380 }}
      >
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{
            contractAddress: "",
            firstBlockNumber: null,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="Contract Address"
            name="contractAddress"
            rules={[
              {
                required: true,
                message: "Please input Contract address",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Contract creation block number"
            name="firstBlockNumber"
            rules={[
              {
                required: true,
                message: "Please input Contract creation block number",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Analyze
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={[
            {
              title: "From",
              dataIndex: "from",
              key: "from",
            },
            {
              title: "To",
              dataIndex: "to",
              key: "to",
            },
            {
              title: "Amount",
              dataIndex: "amount",
              key: "amount",
              render: (value) => (
                <span>{ethers.BigNumber.from(value).toString()}</span>
              ),
            },
          ]}
          dataSource={transfers}
        />
      </div>
    </>
  );
};
