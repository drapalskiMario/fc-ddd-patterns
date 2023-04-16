import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async find(id: string): Promise<Order> {
    let orderModel: OrderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: { id },
        include: OrderItemModel,
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Order not found");
    }

    return this.mapModelToEntity(orderModel);
  }

  async findAll(): Promise<Order[]> {
    const ordersModel = await OrderModel.findAll({
      include: OrderItemModel,
    });

    return ordersModel.map((orderModel) => {
      return this.mapModelToEntity(orderModel);
    });
  }

  async update(entity: Order): Promise<void> {
    const order = await OrderModel.findByPk(entity.id, {
      include: OrderItemModel,
    });

    if (order) {
      order.setAttributes({
        customer_id: entity.customerId,
        total: entity.total(),
      });

      const items = entity.items.map(
        (item) =>
          <OrderItemModel>{
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
            order_id: order.id
          }
      );

      for (const item of items) {
        await OrderItemModel.findOrCreate({
          where: { id: item.id },
          defaults: {
            ...item,
          },
        });
      }

      await order.save();
    }
  }

  private mapModelToEntity(orderModel: OrderModel): Order {
    const orderItens = orderModel.items.map((item) => {
      return new OrderItem(
        item.id,
        item.name,
        item.price,
        item.product_id,
        item.quantity
      );
    });
    return new Order(orderModel.id, orderModel.customer_id, orderItens);
  }
}
