import { getBaseUrl } from './baseUrl';

interface OrderItem {
    order_item_list: number[];
    order_id: number;
}

interface PackAndRtsRequest {
    pack_order_list: OrderItem[];
    delivery_type: string;
    shipment_provider_code: string;
    shipping_allocate_type: string;
}

interface PackAndRtsResponse {
    success: boolean;
    message: string;
    processed_orders?: number;
    failed_orders?: number;
    errors?: string[];
}

export const packAndRtsOrders = async (
    packOrderList: OrderItem[],
    order_access_token: string
): Promise<PackAndRtsResponse> => {
    const BASE_URL = getBaseUrl();

    try {
        if (!packOrderList || packOrderList.length === 0) {
            throw new Error('No orders provided');
        }

        if (!order_access_token) {
            throw new Error('No order access token provided');
        }

        if (packOrderList.length > 20) {
            throw new Error('Maximum 20 orders can be processed at once');
        }

        const validatedOrders = packOrderList.map(order => {
            if (!order.order_id || !order.order_item_list || order.order_item_list.length === 0) {
                throw new Error(`Invalid order data: ${JSON.stringify(order)}`);
            }
            return {
                order_id: parseInt(order.order_id.toString()),
                order_item_list: order.order_item_list.map(item => parseInt(item.toString()))
            };
        });

        const requestBody: PackAndRtsRequest = {
            pack_order_list: validatedOrders,
            delivery_type: "dropship",
            shipment_provider_code: "FM50",
            shipping_allocate_type: "TFS"
        };

        const response = await fetch(`${BASE_URL}/make-order-pack-and-rts?access_token=${order_access_token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }

        const data: PackAndRtsResponse = await response.json();
        return data;

    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            processed_orders: 0,
            failed_orders: packOrderList?.length || 0,
            errors: [error.message]
        };
    }
};

export const prepareOrderData = (orderItems: any[]): OrderItem[] => {
    const orderGroups: { [key: number]: number[] } = {};

    orderItems.forEach(item => {
        const orderId = parseInt(item.order_id);
        const orderItemId = parseInt(item.order_item_id);

        if (!orderGroups[orderId]) {
            orderGroups[orderId] = [];
        }
        orderGroups[orderId].push(orderItemId);
    });

    return Object.keys(orderGroups).map(orderId => ({
        order_id: parseInt(orderId),
        order_item_list: orderGroups[parseInt(orderId)]
    }));
};
