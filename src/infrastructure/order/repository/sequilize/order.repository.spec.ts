import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: OrderItemModel,
    });

    const foundOrder = await orderRepository.find("123");

    expect(orderModel.toJSON()).toStrictEqual({
      id: foundOrder.id,
      customer_id: foundOrder.customerId,
      total: foundOrder.total(),
      items: [
        {
          id: foundOrder.items[0].id,
          name: foundOrder.items[0].name,
          price: foundOrder.items[0].price,
          quantity: foundOrder.items[0].quantity,
          order_id: foundOrder.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItemOne = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const orderItemTwo = new OrderItem(
      "2",
      product.name,
      product.price,
      product.id,
      2
    );

    const orderOne = new Order("123", "123", [orderItemOne]);
    const orderTwo = new Order("321", "123", [orderItemTwo]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(orderOne);
    await orderRepository.create(orderTwo);

    const ordersModel = await orderRepository.findAll();

    expect(ordersModel).toHaveLength(2);
    expect(ordersModel).toContainEqual(orderOne);
    expect(ordersModel).toContainEqual(orderTwo);
  });

  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItemOne = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItemOne]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: OrderItemModel,
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItemOne.id,
          name: orderItemOne.name,
          price: orderItemOne.price,
          quantity: orderItemOne.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });

    const orderItemTwo = new OrderItem(
      "2",
      product.name,
      product.price,
      product.id,
      2
    );

    const orderUpdated = new Order("123", "123", [orderItemOne, orderItemTwo]);
    await orderRepository.update(orderUpdated);

    const orderModelUpdated = await OrderModel.findOne({
      where: { id: order.id },
      include: OrderItemModel,
    });

    expect(orderModelUpdated.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: orderUpdated.total(),
      items: [
        {
          id: orderItemOne.id,
          name: orderItemOne.name,
          price: orderItemOne.price,
          quantity: orderItemOne.quantity,
          order_id: "123",
          product_id: "123",
        },
        {
          id: orderItemTwo.id,
          name: orderItemTwo.name,
          price: orderItemTwo.price,
          quantity: orderItemTwo.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });
});
