import { EditOutlined, EyeOutlined, FilterOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { IResourceComponentsProps, useInvalidate, useNavigation, useTranslate } from "@refinedev/core";
import { Button, Dropdown, Table } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
    ActionsColumn,
    CustomFieldColumn,
    DateColumn,
    NumberColumn,
    RichColumn,
    SortedColumn,
} from "../../components/column";
import { useLiveify } from "../../components/liveify";
import { removeUndefined } from "../../utils/filtering";
import { EntityType, useGetFields } from "../../utils/queryFields";
import { TableState, useInitialTableState, useStoreInitialState } from "../../utils/saveload";
import { IVendor } from "./model";

dayjs.extend(utc);

const namespace = "vendorList-v2";

const allColumns: (keyof IVendor & string)[] = ["id", "name", "registered", "comment", "empty_spool_weight"];

export const VendorList: React.FC<IResourceComponentsProps> = () => {
  const t = useTranslate();
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const extraFields = useGetFields(EntityType.vendor);

  const allColumnsWithExtraFields = [...allColumns, ...(extraFields.data?.map((field) => "extra." + field.key) ?? [])];

  // Load initial state
  const initialState = useInitialTableState(namespace);

  // Fetch data from the API
  const { tableProps, sorters, setSorters, filters, setFilters, current, pageSize, setCurrent } = useTable<IVendor>({
    syncWithLocation: false,
    pagination: {
      mode: "server",
      current: initialState.pagination.current,
      pageSize: initialState.pagination.pageSize,
    },
    sorters: {
      mode: "server",
      initial: initialState.sorters,
    },
    filters: {
      mode: "server",
      initial: initialState.filters,
    },
    liveMode: "manual",
    onLiveEvent(event) {
      if (event.type === "created" || event.type === "deleted") {
        // updated is handled by the liveify
        invalidate({
          resource: "vendor",
          invalidates: ["list"],
        });
      }
    },
  });

  // Create state for the columns to show
  const [showColumns, setShowColumns] = useState<string[]>(initialState.showColumns ?? allColumns);

  // Store state in local storage
  const tableState: TableState = {
    sorters,
    filters,
    pagination: { current, pageSize },
    showColumns,
  };
  useStoreInitialState(namespace, tableState);

  // Collapse the dataSource to a mutable list
  const queryDataSource: IVendor[] = useMemo(() => {
    return (tableProps.dataSource || []).map((record) => ({ ...record }));
  }, [tableProps.dataSource]);
  const dataSource = useLiveify(
    "vendor",
    queryDataSource,
    useCallback((record: IVendor) => record, [])
  );

  if (tableProps.pagination) {
    tableProps.pagination.showSizeChanger = true;
  }

  const { editUrl, showUrl, cloneUrl } = useNavigation();
  const actions = (record: IVendor) => [
    { name: t("buttons.show"), icon: <EyeOutlined />, link: showUrl("vendor", record.id) },
    { name: t("buttons.edit"), icon: <EditOutlined />, link: editUrl("vendor", record.id) },
    { name: t("buttons.clone"), icon: <PlusSquareOutlined />, link: cloneUrl("vendor", record.id) },
  ];

  const commonProps = {
    t,
    navigate,
    actions,
    dataSource,
    tableState,
    sorter: true,
  };

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => {
              setFilters([], "replace");
              setSorters([{ field: "id", order: "asc" }]);
              setCurrent(1);
            }}
          >
            {t("buttons.clearFilters")}
          </Button>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: allColumnsWithExtraFields.map((column_id) => {
                if (column_id.indexOf("extra.") === 0) {
                  const extraField = extraFields.data?.find((field) => "extra." + field.key === column_id);
                  return {
                    key: column_id,
                    label: extraField?.name ?? column_id,
                  };
                }

                return {
                  key: column_id,
                  label: t(`vendor.fields.${column_id}`),
                };
              }),
              selectedKeys: showColumns,
              selectable: true,
              multiple: true,
              onDeselect: (keys) => {
                setShowColumns(keys.selectedKeys);
              },
              onSelect: (keys) => {
                setShowColumns(keys.selectedKeys);
              },
            }}
          >
            <Button type="primary" icon={<EditOutlined />}>
              {t("buttons.hideColumns")}
            </Button>
          </Dropdown>
          {defaultButtons}
        </>
      )}
    >
      <Table
        {...tableProps}
        sticky
        tableLayout="auto"
        scroll={{ x: "max-content" }}
        dataSource={dataSource}
        rowKey="id"
        columns={removeUndefined([
          SortedColumn({
            ...commonProps,
            id: "id",
            i18ncat: "vendor",
            width: 70,
          }),
          SortedColumn({
            ...commonProps,
            id: "name",
            i18ncat: "vendor",
          }),
          DateColumn({
            ...commonProps,
            id: "registered",
            i18ncat: "vendor",
            width: 200,
          }),
          NumberColumn({
            ...commonProps,
            id: "empty_spool_weight",
            i18ncat: "vendor",
            unit: "g",
            maxDecimals: 0,
            width: 200,
          }),
          ...(extraFields.data?.map((field) => {
            return CustomFieldColumn({
              ...commonProps,
              field,
            });
          }) ?? []),
          RichColumn({
            ...commonProps,
            id: "comment",
            i18ncat: "vendor",
          }),
          ActionsColumn<IVendor>(t("table.actions"), actions),
        ])}
      />
    </List>
  );
};

export default VendorList;
